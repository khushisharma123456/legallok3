from flask import Flask, render_template, request, redirect, url_for, session, flash
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import os


app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///legallok.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

    
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    phone = db.Column(db.String(15), nullable=False)
    password = db.Column(db.String(200), nullable=False)

class Lawyer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    phone = db.Column(db.String(15), nullable=False)
    password = db.Column(db.String(200), nullable=False)
    bar_number = db.Column(db.String(100), nullable=False)
    practice_years = db.Column(db.String(20), nullable=False)
    specialization = db.Column(db.String(50), nullable=False)
    address = db.Column(db.String(200), nullable=False)
    city = db.Column(db.String(50), nullable=False)
    state = db.Column(db.String(50), nullable=False)
    pincode = db.Column(db.String(10), nullable=False)

# ✅ Instead of @app.before_first_request, do this:
with app.app_context():
    db.create_all()
    print("Created DB")

@app.route('/')
def home():
    return render_template('homePage.html')

@app.route("/signup", methods=["GET", "POST"])
def signup():
    if request.method == "POST":
        name = request.form.get("fullName")
        email = request.form.get("email")
        phone = request.form.get("phone")
        password = request.form.get("password")

        user = User(full_name=name, email=email, phone=phone, password=generate_password_hash(password))
        db.session.add(user)
        db.session.commit()
        flash("User registered successfully!")
        return redirect("/login")

    return render_template("signup.html")

@app.route("/lawyer_register", methods=["GET", "POST"])
def lawyer_register():
    if request.method == "POST":
        data = request.form

        # Check if all required fields are filled
        required_fields = [
            "firstName", "lastName", "email", "phone", "password",
            "barNumber", "practiceYears", "specialization",
            "address", "city", "state", "pincode"
        ]

        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            flash(f"Missing fields: {', '.join(missing_fields)}", "error")
            return redirect(url_for('lawyer_register'))

        lawyer = Lawyer(
            first_name=data.get("firstName"),
            last_name=data.get("lastName"),
            email=data.get("email"),
            phone=data.get("phone"),
            password=generate_password_hash(data.get("password")),
            bar_number=data.get("barNumber"),
            practice_years=data.get("practiceYears"),
            specialization=data.get("specialization"),
            address=data.get("address"),
            city=data.get("city"),
            state=data.get("state"),
            pincode=data.get("pincode")
        )
        db.session.add(lawyer)
        db.session.commit()
        flash("Lawyer registered successfully!")
        return redirect("/login")

    return render_template("lawyer login.html")


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        # Try to find a user first
        user = User.query.filter_by(email=email).first()
        if user and check_password_hash(user.password, password):
            session['user_id'] = user.id
            session['role'] = 'user'
            flash('User login successful!', 'success')
            return redirect(url_for('dashboard'))

        # If not found, try to find a lawyer
        lawyer = Lawyer.query.filter_by(email=email).first()
        if lawyer and check_password_hash(lawyer.password, password):
            session['lawyer_id'] = lawyer.id
            session['role'] = 'lawyer'
            flash('Lawyer login successful!', 'success')
            return redirect(url_for('lawyer_dashboard'))

        flash('Invalid email or password.', 'error')
        return redirect(url_for('login'))

    return render_template('login.html')

@app.route('/lawyer_dashboard')
def lawyer_dashboard():
    if session.get('role') != 'lawyer':
        flash("Access denied.", "error")
        return redirect(url_for('login'))

    lawyer_id = session.get('lawyer_id')
    lawyer = Lawyer.query.get(lawyer_id)
    return render_template('lawyer dashboard.html', lawyer=lawyer)


@app.route('/dashboard')
def dashboard():
    if session.get('role') != 'user':
        flash("Access denied.", "error")
        return redirect(url_for('login'))

    user_id = session.get('user_id')
    user = User.query.get(user_id)
    return render_template('dashboard.html', user=user)  # ✅ pass user to template



@app.route('/form')
def form():
    return render_template('form.html')

@app.route('/community')
def community():
    return render_template('communityforum.html')

@app.route('/chatbot')
def chatbot():
    return render_template('chatbot.html')

@app.route('/askquestion')
def askquestion():
    return render_template('askquestion.html')

@app.route('/answerquestion')
def answerquestion():
    return render_template('answerquestion.html')


@app.route('/form_filling')
def form_filling():
    return render_template('form filling.html')


if __name__ == "__main__":
    app.run(debug=True)