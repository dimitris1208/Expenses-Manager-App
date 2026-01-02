from flask import Flask, jsonify, request, abort
from functools import wraps
import jwt
import datetime
from sqlalchemy.exc import IntegrityError
from passlib.context import CryptContext

# Import your modules
from database import db_session, init_db
from models import User, Expense, ExpenseShare

app = Flask(__name__)

# CONFIGURATION
SECRET_KEY = "ioefjca948ythsjdfg023urichsdghsjkhaw[33sdghjwarfqwefasefsewfwae]"
ALGORITHM = "HS256"

# Security Setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- 1. HELPER FUNCTIONS ---

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

# The "Decorator" (Replaces FastAPI Depends)
# Put @token_required above any route to protect it
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # Check header: "Authorization: Bearer <token>"
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
        
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401

        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            current_user = User.query.filter_by(username=data['sub']).first()
        except:
            return jsonify({'message': 'Token is invalid!'}), 401

        return f(current_user, *args, **kwargs)
    return decorated

# Close DB session after every request
@app.teardown_appcontext
def shutdown_session(exception=None):
    db_session.remove()

# Initialize DB (Create tables if not exist)
@app.before_first_request
def create_tables():
    init_db()

# --- 2. AUTH ROUTES ---

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'message': 'Missing credentials'}), 400

    user = User.query.filter_by(username=data['username']).first()

    if not user or not verify_password(data['password'], user.password_hash):
        return jsonify({'message': 'Invalid credentials'}), 401

    # Generate Token
    token_payload = {
        'sub': user.username,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=30)
    }
    token = jwt.encode(token_payload, SECRET_KEY, algorithm=ALGORITHM)

    return jsonify({
        'token': token, 
        'user_id': user.id,
        'full_name': user.full_name
    })

# --- 3. EXPENSE ROUTES ---

@app.route('/expenses', methods=['POST'])
@token_required
def create_expense(current_user):
    data = request.get_json()
    description = data.get('description')
    total_amount = data.get('total_amount')

    if not description or not total_amount:
        return jsonify({'message': 'Missing data'}), 400

    # 1. Create Parent Expense
    new_expense = Expense(
        payer_id=current_user.id,
        description=description,
        total_amount=total_amount,
        is_fully_settled=False
    )
    db_session.add(new_expense)
    db_session.commit() # Commit to get the ID

    # 2. Split Logic
    all_users = User.query.all()
    if not all_users:
        return jsonify({'message': 'No users found'}), 400

    split_amount = float(total_amount) / len(all_users)

    # 3. Create Shares
    for user in all_users:
        if user.id == current_user.id:
            continue # Don't create debt for the payer
        
        new_share = ExpenseShare(
            expense_id=new_expense.id,
            debtor_id=user.id,
            amount_owed=split_amount,
            is_paid=False
        )
        db_session.add(new_share)

    db_session.commit()
    return jsonify({'message': 'Expense created', 'id': new_expense.id}), 201

# --- 4. DASHBOARD ROUTES ---

@app.route('/my-debts', methods=['GET'])
@token_required
def get_my_debts(current_user):
    # Fetch active debts
    shares = ExpenseShare.query.filter_by(debtor_id=current_user.id, is_paid=False).all()
    
    # Manually serialize to JSON
    output = []
    for share in shares:
        output.append({
            'id': share.id,
            'amount': float(share.amount_owed),
            'description': share.expense.description, # Access parent via relationship
            'payer': share.expense.payer.full_name
        })
    return jsonify(output)

@app.route('/my-receivables', methods=['GET'])
@token_required
def get_my_receivables(current_user):
    expenses = Expense.query.filter_by(payer_id=current_user.id, is_fully_settled=False).all()
    
    output = []
    for exp in expenses:
        # Get list of who still owes money for this specific bill
        pending_people = [s.debtor.full_name for s in exp.shares if not s.is_paid]
        
        output.append({
            'id': exp.id,
            'description': exp.description,
            'total': float(exp.total_amount),
            'pending_from': pending_people
        })
    return jsonify(output)

# --- 5. PAYMENT ACTION ---

@app.route('/shares/<int:share_id>/pay', methods=['POST'])
@token_required
def pay_share(current_user, share_id):
    share = ExpenseShare.query.get(share_id)
    
    if not share:
        return jsonify({'message': 'Debt not found'}), 404

    # Mark as paid
    share.is_paid = True
    db_session.commit()

    # Check siblings to see if we can close the parent expense
    unpaid_siblings = ExpenseShare.query.filter_by(expense_id=share.expense_id, is_paid=False).count()

    if unpaid_siblings == 0:
        parent_expense = Expense.query.get(share.expense_id)
        parent_expense.is_fully_settled = True
        db_session.commit()
        return jsonify({'message': 'Paid. Expense Fully Settled!'})

    return jsonify({'message': 'Paid. Remaining balance exists.'})

if __name__ == '__main__':
    app.run(debug=True)