from database import db_session, init_db
from models import User
from passlib.context import CryptContext

# 1. Setup Security (Same as your main app)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_hash(password):
    return pwd_context.hash(password)

def seed_data():
    # 2. Define your Test Users
    # Structure: (Username, Password, Full Name)
    users_to_add = [
        ("Straga", "Local1208", "Dimitris Stragalinos"),
        ("Saxta", "Local1505", "Panagiotis Sachtaridis"),
        ("Tom", "Local1906", "Thomas Achilleas Mpillas"),
        ("Bld", "Local0503", "Dimitris Mpliatkas"),
        
    ]

    print("--- Starting Seed ---")
    
    for username, password, full_name in users_to_add:
        # Check if user already exists
        existing = User.query.filter_by(username=username).first()
        if existing:
            print(f"User {username} already exists. Skipping.")
            continue
            
        # Create new user with HASHED password
        new_user = User(
            username=username,
            password_hash=get_hash(password), # <--- Critical Step
            full_name=full_name
        )
        db_session.add(new_user)
        print(f"Added: {username}")

    db_session.commit()
    print("--- Success! Users created. ---")

if __name__ == "__main__":
    seed_data()