from flask import Flask, jsonify, request
from flask_cors import CORS
from functools import wraps
import jwt
import datetime
from sqlalchemy import func
from werkzeug.security import generate_password_hash, check_password_hash

# Import your modules
from database import db_session, init_db
from models import User, Expense, Settlement

app = Flask(__name__)
CORS(app)

SECRET_KEY = "ioefjca948ythsjdfg023urichsdghsjkhaw[33sdghjwarfqwefasefsewfwae]"
ALGORITHM = "HS256"

# --- 1. AUTH HELPERS ---
def verify_password(plain, hashed):
    return check_password_hash(hashed, plain)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
        if not token: return jsonify({'message': 'Missing token'}), 401
        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            current_user = User.query.filter_by(username=data['sub']).first()
        except: return jsonify({'message': 'Invalid token'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

@app.teardown_appcontext
def shutdown_session(exception=None):
    db_session.remove()

with app.app_context():
    init_db()

# --- 2. AUTH ROUTES ---
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    if not user or not verify_password(data['password'], user.password_hash):
        return jsonify({'message': 'Invalid credentials'}), 401
    
    token = jwt.encode({
        'sub': user.username,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=30)
    }, SECRET_KEY, algorithm=ALGORITHM)
    
    return jsonify({'token': token, 'user_id': user.id, 'full_name': user.full_name})

# --- 3. THE GREEDY ALGORITHM ---
def calculate_debts():
    """
    Calculates who owes whom based on:
    (Total Expenses Paid - Fair Share) + (Settlements Paid - Settlements Received)
    """
    users = User.query.all()
    user_map = {u.id: u.full_name for u in users}
    N = len(users)
    if N == 0: return [], {}

    # 1. Total Company Spend
    total_expense = db_session.query(func.sum(Expense.amount)).scalar() or 0.0
    fair_share = total_expense / N

    # 2. Calculate Net Balances
    balances = {} 
    for user in users:
        paid_expenses = db_session.query(func.sum(Expense.amount)).filter(Expense.payer_id == user.id).scalar() or 0.0
        
        # Settlements
        paid_settlements = db_session.query(func.sum(Settlement.amount)).filter(Settlement.payer_id == user.id).scalar() or 0.0
        received_settlements = db_session.query(func.sum(Settlement.amount)).filter(Settlement.receiver_id == user.id).scalar() or 0.0
        
        # Logic: 
        # Base Balance = What I paid for company - My Fair Share
        # Final Balance = Base + (I paid someone back) - (Someone paid me)
        base_balance = paid_expenses - fair_share
        final_balance = base_balance + paid_settlements - received_settlements
        balances[user.id] = final_balance

    # 3. Greedy Matching
    debtors = []
    creditors = []
    for uid, amount in balances.items():
        amount = round(amount, 2)
        if amount < -0.01: debtors.append({'id': uid, 'amount': amount})
        elif amount > 0.01: creditors.append({'id': uid, 'amount': amount})

    debtors.sort(key=lambda x: x['amount'])     # Most negative first
    creditors.sort(key=lambda x: x['amount'], reverse=True) # Most positive first

    transactions = []
    i = 0; j = 0
    while i < len(debtors) and j < len(creditors):
        debtor = debtors[i]
        creditor = creditors[j]
        amount = min(abs(debtor['amount']), creditor['amount'])
        
        transactions.append({
            'from': user_map[debtor['id']],
            'to': user_map[creditor['id']],
            'amount': round(amount, 2),
            'payer_id': debtor['id'],
            'receiver_id': creditor['id']
        })
        
        debtor['amount'] += amount
        creditor['amount'] -= amount
        
        if abs(debtor['amount']) < 0.01: i += 1
        if creditor['amount'] < 0.01: j += 1

    return transactions, balances

# --- 4. DATA ROUTES ---

@app.route('/dashboard', methods=['GET'])
@token_required
def get_dashboard(current_user):
    suggested_payments, raw_balances = calculate_debts()
    
    # Get Expense History
    expenses = Expense.query.order_by(Expense.date.desc()).limit(20).all()
    exp_list = [{
        'id': e.id, 
        'desc': e.description, 
        'amount': e.amount, 
        'payer': e.payer.full_name, 
        'date': e.date.strftime('%Y-%m-%d')
    } for e in expenses]

    return jsonify({
        'my_balance': round(raw_balances.get(current_user.id, 0), 2),
        'suggested_payments': suggested_payments,
        'expenses': exp_list
    })

@app.route('/expenses', methods=['POST'])
@token_required
def add_expense(current_user):
    data = request.get_json()
    new_expense = Expense(
        description=data['description'],
        amount=float(data['amount']), # Changed 'total_amount' back to 'amount'
        payer_id=current_user.id
    )
    db_session.add(new_expense)
    db_session.commit()
    return jsonify({'message': 'Expense Added'})

@app.route('/settlements', methods=['POST'])
@token_required
def add_settlement(current_user):
    data = request.get_json()
    new_settlement = Settlement(
        payer_id=current_user.id,
        receiver_id=data['receiver_id'],
        amount=float(data['amount'])
    )
    db_session.add(new_settlement)
    db_session.commit()
    return jsonify({'message': 'Payment Recorded'})


# --- ADD THIS TO MAIN.PY IF MISSING ---
@app.route('/expenses', methods=['GET'])
@token_required
def get_expenses(current_user):
    # Check if frontend wants a specific filter
    filter_mode = request.args.get('filter') # 'mine' or 'all'
    
    query = Expense.query
    
    if filter_mode == 'mine':
        query = query.filter_by(payer_id=current_user.id)
        
    # Always sort by newest first
    expenses = query.order_by(Expense.date.desc()).all()
    
    output = [{
        'id': e.id,
        'description': e.description,
        'amount': e.amount,
        'date': e.date.strftime('%Y-%m-%d'),
        'payer': e.payer.full_name,
        'is_mine': (e.payer_id == current_user.id)
    } for e in expenses]
    
    return jsonify(output)


# --- 5. HISTORY ROUTE ---
@app.route('/settlements/history', methods=['GET'])
@token_required
def get_settlement_history(current_user):
    # Fetch all past payments (newest first)
    settlements = Settlement.query.order_by(Settlement.date.desc()).all()
    
    output = [{
        'id': s.id,
        'payer': s.payer.full_name,
        'receiver': s.receiver.full_name,
        'amount': s.amount,
        'date': s.date.strftime('%Y-%m-%d')
    } for s in settlements]
    
    return jsonify(output)


if __name__ == '__main__':
    app.run()