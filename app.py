from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify, send_file, make_response
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import json
import os
from datetime import datetime
from flask_login import LoginManager, UserMixin, login_required, current_user, login_user, logout_user
import pdfkit
import tempfile
import requests

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///legallok.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# ----------------- MODELS -----------------
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    phone = db.Column(db.String(15), nullable=False)
    password = db.Column(db.String(200), nullable=False)
    filled_forms = db.relationship('FilledForm', backref='user', lazy=True)

    def get_id(self):
        return str(self.id)

    def is_authenticated(self):
        return True

    def is_active(self):
        return True

    def is_anonymous(self):
        return False


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


class FilledForm(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    form_id = db.Column(db.String(50), nullable=False)
    form_title = db.Column(db.String(200), nullable=False)
    form_data = db.Column(db.Text, nullable=False)  # JSON data as text
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    template_name = db.Column(db.String(200), nullable=False)


class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    user = db.relationship('User', backref=db.backref('posts', lazy=True))
    comments = db.relationship('Comment', backref='post', lazy=True, cascade="all, delete-orphan")


class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'), nullable=False)
    user = db.relationship('User', backref=db.backref('comments', lazy=True))


# ----------------- ROUTES -----------------

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

        if User.query.filter_by(email=email).first():
            flash("Email already registered. Please login.", "error")
            return redirect("/login")

        user = User(
            full_name=name,
            email=email,
            phone=phone,
            password=generate_password_hash(password)
        )
        db.session.add(user)
        db.session.commit()
        flash("User registered successfully!", "success")
        return redirect("/login")

    return render_template("signup.html")


@app.route("/lawyer_register", methods=["GET", "POST"])
def lawyer_register():
    if request.method == "POST":
        data = request.form

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
        flash("Lawyer registered successfully!", "success")
        return redirect("/login")

    return render_template("lawyer login.html")


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        user = User.query.filter_by(email=email).first()
        if user and check_password_hash(user.password, password):
            login_user(user)
            session['role'] = 'user'
            flash('User login successful!', 'success')
            return redirect(url_for('dashboard'))

        lawyer = Lawyer.query.filter_by(email=email).first()
        if lawyer and check_password_hash(lawyer.password, password):
            session['lawyer_id'] = lawyer.id
            session['role'] = 'lawyer'
            flash('Lawyer login successful!', 'success')
            return redirect(url_for('lawyer_dashboard'))

        flash('Invalid email or password.', 'error')
        return redirect(url_for('login'))

    return render_template('login.html')


@app.route('/dashboard')
@login_required
def dashboard():
    if session.get('role') != 'user':
        flash("Access denied.", "error")
        return redirect(url_for('login'))

    return render_template('dashboard.html', user=current_user)


@app.route('/lawyer_dashboard')
def lawyer_dashboard():
    if session.get('role') != 'lawyer':
        flash("Access denied.", "error")
        return redirect(url_for('login'))

    lawyer = Lawyer.query.get(session['lawyer_id'])
    return render_template('lawyer dashboard.html', lawyer=lawyer)


@app.route('/logout')
def logout():
    logout_user()
    session.clear()
    flash("Logged out successfully.")
    return redirect(url_for('login'))


# ----------------- OTHER PAGES -----------------

@app.route('/form')
@login_required
def form():
    return render_template('form2.html', user=current_user)

@app.route('/form/<form_id>', methods=['GET', 'POST'])
def form_detail(form_id):
    # Load the legal forms data
    try:
        with open(os.path.join(app.root_path, 'data', 'legal_forms.json'), 'r') as file:
            forms_data = json.load(file)
            
        # Find the specific form by ID
        form_data = None
        for form in forms_data['forms']:
            if form['id'] == form_id:
                form_data = form
                break
                
        if form_data:
            if request.method == 'POST':
                # Handle form submission
                if 'user_id' not in session:
                    flash('You must be logged in to submit a form.', 'error')
                    return redirect(url_for('login'))
                
                # Get form data
                form_values = {}
                for field in form_data['fields']:
                    field_name = field['name']
                    form_values[field_name] = request.form.get(field_name, '')
                
                # Create a new filled form record
                filled_form = FilledForm(
                    user_id=session['user_id'],
                    form_id=form_id,
                    form_title=form_data['title'],
                    form_data=json.dumps(form_values),
                    template_name=form_data['template_name']
                )
                
                db.session.add(filled_form)
                db.session.commit()
                
                flash('Form submitted successfully!', 'success')
                return redirect(url_for('filled_forms'))
                
            return render_template('form.html', form=form_data)
        else:
            flash('Form not found.', 'error')
            return redirect(url_for('form'))
    except Exception as e:
        flash(f'Error loading form: {str(e)}', 'error')
        return redirect(url_for('form'))

@app.route('/api/forms')
def get_forms():
    try:
        with open(os.path.join(app.root_path, 'data', 'legal_forms.json'), 'r') as file:
            forms_data = json.load(file)
        return jsonify(forms_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/forms/<form_id>')
def get_form(form_id):
    try:
        with open(os.path.join(app.root_path, 'data', 'legal_forms.json'), 'r') as file:
            forms_data = json.load(file)
            
        # Find the specific form by ID
        form_data = None
        for form in forms_data['forms']:
            if form['id'] == form_id:
                form_data = form
                break
                
        if form_data:
            return jsonify(form_data)
        else:
            return jsonify({'error': 'Form not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/filled-forms')
@login_required
def filled_forms():
    filled_forms = FilledForm.query.filter_by(user_id=current_user.id).order_by(FilledForm.created_at.desc()).all()
    return render_template('filled forms.html', filled_forms=filled_forms, user=current_user)

@app.route('/api/filled-forms')
@login_required
def get_user_filled_forms():
    filled_forms = FilledForm.query.filter_by(user_id=current_user.id).order_by(FilledForm.created_at.desc()).all()
    return jsonify([{
        'id': form.id,
        'form_id': form.form_id,
        'form_title': form.form_title,
        'created_at': form.created_at.strftime('%Y-%m-%d %H:%M:%S'),
        'updated_at': form.updated_at.strftime('%Y-%m-%d %H:%M:%S')
    } for form in filled_forms])

def load_form_template(template_id):
    try:
        with open('data/form_templates.json', 'r') as f:
            templates = json.load(f)
            return templates.get(template_id)
    except Exception as e:
        print(f"Error loading form template: {e}")
        return None

def format_form_data(template_id, form_data):
    try:
        # Load the template
        template = load_form_template(template_id)
        
        # Initialize the formatted data structure
        formatted_data = {
            "document_title": "LEGAL AGREEMENT",
            "document_date": datetime.now().strftime("%dth %B %Y"),
            "parties": {},
            "terms": {},
            "clauses": {},
            "signatures": {}
        }
        
        # If we have a template, use it to format the data
        if template:
            formatted_data["document_title"] = template.get("document_title", "LEGAL AGREEMENT")
            
            # Format parties information
            formatted_data["parties"] = {
                "party1_name": form_data.get("company_name", "[Company Name]"),
                "party1_description": f"having its registered office at {form_data.get('company_address', '[Address]')}",
                "party1_reference": "Employer",
                "party2_name": form_data.get("employee_name", "[Employee Name]"),
                "party2_description": f"residing at {form_data.get('employee_address', '[Address]')}",
                "party2_reference": "Employee"
            }
            
            # Format terms
            formatted_data["terms"] = {
                "Job Title": form_data.get("job_title", "Not specified"),
                "Monthly Salary": form_data.get("monthly_salary", "Not specified"),
                "Probation Period": form_data.get("probation_period", "Not specified"),
                "Termination Notice": form_data.get("termination_notice", "Not specified")
            }
            
            # Format clauses
            formatted_data["clauses"] = {
                "Confidentiality": form_data.get("confidentiality", "Employee shall not disclose any proprietary information...")
            }
            
            # Format signatures
            formatted_data["signatures"] = {
                "party1_name": form_data.get("employer_signature", "[Employer Signature]"),
                "party1_date": form_data.get("employer_signature_date", datetime.now().strftime("%dth %B %Y")),
                "party2_name": form_data.get("employee_signature", "[Employee Signature]"),
                "party2_date": form_data.get("employee_signature_date", datetime.now().strftime("%dth %B %Y"))
            }
        else:
            # If no template, create a basic structure from the raw data
            if isinstance(form_data, dict):
                # Copy any existing fields that match our structure
                for key in ["document_title", "document_date"]:
                    if key in form_data:
                        formatted_data[key] = form_data[key]
                
                # Handle parties
                if "parties" in form_data:
                    formatted_data["parties"] = form_data["parties"]
                else:
                    formatted_data["parties"] = {
                        "party1_name": "[Party 1 Name]",
                        "party1_description": "[Party 1 Description]",
                        "party1_reference": "Party 1",
                        "party2_name": "[Party 2 Name]",
                        "party2_description": "[Party 2 Description]",
                        "party2_reference": "Party 2"
                    }
                
                # Add any terms from the form data
                for key, value in form_data.items():
                    if key not in ['document_title', 'document_date', 'parties', 'clauses', 'signatures']:
                        formatted_data['terms'][key] = value
        
        # Add any additional terms from the form data that aren't in our standard format
        if isinstance(form_data, dict):
            for key, value in form_data.items():
                if key not in formatted_data and key not in ['document_title', 'document_date', 'parties', 'clauses', 'signatures']:
                    formatted_data['terms'][key] = value
        
        return formatted_data
    except Exception as e:
        print(f"Error formatting form data: {e}")
        # Return a basic structure if there's an error
        return {
            "document_title": "LEGAL AGREEMENT",
            "document_date": datetime.now().strftime("%dth %B %Y"),
            "parties": {
                "party1_name": "[Party 1 Name]",
                "party1_description": "[Party 1 Description]",
                "party1_reference": "Party 1",
                "party2_name": "[Party 2 Name]",
                "party2_description": "[Party 2 Description]",
                "party2_reference": "Party 2"
            },
            "terms": {"Raw Data": str(form_data)},
            "clauses": {},
            "signatures": {
                "party1_name": "[Party 1 Signature]",
                "party1_date": datetime.now().strftime("%dth %B %Y"),
                "party2_name": "[Party 2 Signature]",
                "party2_date": datetime.now().strftime("%dth %B %Y")
            }
        }

@app.route('/api/filled-forms/<int:form_id>', methods=['GET'])
@login_required
def get_filled_form(form_id):
    form = FilledForm.query.get_or_404(form_id)
    if form.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    try:
        # Parse the form data
        form_data = json.loads(form.form_data)
        
        # Load the template and format the data
        formatted_data = format_form_data(form.form_id, form_data)
        
        # If formatting fails, use the original data
        if not formatted_data:
            formatted_data = form_data
        
        return jsonify({
            'id': form.id,
            'form_id': form.form_id,
            'template_name': form.template_name,
            'form_data': formatted_data,
            'created_at': form.created_at.isoformat()
        })
    except Exception as e:
        print(f"Error processing form data: {e}")
        # Return the raw form data if there's an error
        return jsonify({
            'id': form.id,
            'form_id': form.form_id,
            'template_name': form.template_name,
            'form_data': form.form_data,
            'created_at': form.created_at.isoformat()
        })

@app.route('/preview/<int:form_id>')
def preview_form(form_id):
    form = FilledForm.query.get_or_404(form_id)
    return render_template('preview.html', form=form)

@app.route('/api/filled-forms/<int:form_id>', methods=['DELETE'])
@login_required
def delete_filled_form(form_id):
    filled_form = FilledForm.query.get_or_404(form_id)
    if filled_form.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    try:
        db.session.delete(filled_form)
        db.session.commit()
        return jsonify({'message': 'Form deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/community')
@login_required
def community():
    posts = Post.query.order_by(Post.created_at.desc()).all()
    return render_template('communityforum.html', user=current_user, posts=posts)

@app.route('/api/posts', methods=['GET'])
@login_required
def get_posts():
    posts = Post.query.order_by(Post.created_at.desc()).all()
    return jsonify([{
        'id': post.id,
        'title': post.title,
        'content': post.content,
        'created_at': post.created_at.strftime('%Y-%m-%d %H:%M:%S'),
        'author': post.user.full_name
    } for post in posts])

@app.route('/api/posts', methods=['POST'])
@login_required
def create_post():
    try:
        data = request.get_json()
        
        if not all(key in data for key in ['title', 'content']):
            return jsonify({'error': 'Missing required fields'}), 400
        
        post = Post(
            title=data['title'],
            content=data['content'],
            user_id=current_user.id
        )
        
        db.session.add(post)
        db.session.commit()
        
        return jsonify({
            'message': 'Post created successfully',
            'post': {
                'id': post.id,
                'title': post.title,
                'content': post.content,
                'created_at': post.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'author': current_user.full_name
            }
        })
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/chatbot')
def chatbot():
    return render_template('chatbot.html')

@app.route('/askquestion')
def askquestion():
    user = User.query.get(session['user_id'])
    return render_template('askquestion.html', user=user)

@app.route('/answerquestion')
def answerquestion():
    return render_template('answerquestion.html')

@app.route('/form_filling')
def form_filling():
    return render_template('form filling.html')

@app.route('/lawyer_cases')
def lawyer_cases():
    return render_template('lawyer cases.html')

@app.route('/direct_urls')
def direct_urls():  # Changed from direct-urls to direct_urls
    return render_template('direct_urls.html')

@app.route('/lawyer_settings')
def lawyer_settings():
    return render_template('lawyer settings.html')

# Route to handle form submissions
@app.route('/api/submit-form', methods=['POST'])
@login_required
def submit_form():
    try:
        data = request.get_json()
        
        # Validate required fields
        if not all(key in data for key in ['form_id', 'form_title', 'form_data']):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Convert form_data to JSON string
        form_data_json = json.dumps(data['form_data'])
        
        # Create a new filled form entry
        filled_form = FilledForm(
            user_id=current_user.id,
            form_id=data['form_id'],
            form_title=data['form_title'],
            form_data=form_data_json,
            template_name=data['template_name']
        )
        
        db.session.add(filled_form)
        db.session.commit()
        
        return jsonify({
            'message': 'Form submitted successfully',
            'filled_form_id': filled_form.id
        })
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/posts/<int:post_id>/comments', methods=['GET'])
def get_post_comments(post_id):
    post = Post.query.get_or_404(post_id)
    comments = Comment.query.filter_by(post_id=post_id).order_by(Comment.created_at.desc()).all()
    return jsonify([{
        'id': comment.id,
        'content': comment.content,
        'created_at': comment.created_at.strftime('%Y-%m-%d %H:%M:%S'),
        'user': {
            'id': comment.user.id,
            'full_name': comment.user.full_name
        }
    } for comment in comments])

@app.route('/api/posts/<int:post_id>/comments', methods=['POST'])
@login_required
def create_comment(post_id):
    post = Post.query.get_or_404(post_id)
    data = request.get_json()
    
    if not data or 'content' not in data:
        return jsonify({'error': 'Content is required'}), 400
        
    comment = Comment(
        content=data['content'],
        user_id=current_user.id,
        post_id=post_id
    )
    
    db.session.add(comment)
    db.session.commit()
    
    return jsonify({
        'id': comment.id,
        'content': comment.content,
        'created_at': comment.created_at.strftime('%Y-%m-%d %H:%M:%S'),
        'user': {
            'id': current_user.id,
            'full_name': current_user.full_name
        }
    }), 201

@app.route('/api/posts/<int:post_id>', methods=['GET'])
def get_post(post_id):
    post = Post.query.get_or_404(post_id)
    return jsonify({
        'id': post.id,
        'title': post.title,
        'content': post.content,
        'created_at': post.created_at.strftime('%Y-%m-%d %H:%M:%S'),
        'user': {
            'id': post.user.id,
            'full_name': post.user.full_name
        }
    })

# ----------------- TRANSLATION API -----------------

@app.route('/api/translate', methods=['POST'])
def translate_proxy():
    try:
        request_data = request.get_json()
        print("Received request data:", request_data)  # Debug log
        
        if not request_data:
            return jsonify({
                'error': 'Invalid Request',
                'message': 'Missing request data'
            }), 400

        fallback_only = request_data.get('fallback_only', False)
        if 'input' in request_data:
            input_data = request_data['input']
            source_text = input_data.get('source')
            source_lang = input_data.get('sourceLanguage', 'en')
            target_lang = input_data.get('targetLanguage')
        else:
            source_text = request_data.get('source')
            source_lang = request_data.get('sourceLanguage', 'en')
            target_lang = request_data.get('target')

        if not source_text or not target_lang:
            return jsonify({
                'error': 'Invalid Request',
                'message': 'Missing required fields: source text or target language'
            }), 400

        # --- CLEAN MOCK TRANSLATIONS DICTIONARY (minimal, valid Python) ---
        mock_translations = {
            'Hello': {'hi': 'नमस्ते', 'bn': 'হ্যালো', 'te': 'హలో', 'ta': 'வணக்கம்'},
            'Legal Assistant': {'hi': 'कानूनी सहायक', 'bn': 'আইনী সহায়ক', 'te': 'న్యాయ సహాయకుడు', 'ta': 'சட்ட உதவியாளர்'},
            'Dashboard': {'hi': 'डैशबोर्ड', 'bn': 'ড্যাশবোর্ড', 'te': 'డాష్‌బోర్డ్', 'ta': 'டாஷ்போர்ட்'},
            'Forms': {'hi': 'फॉर्म', 'bn': 'ফর্ম', 'te': 'ఫారమ్‌లు', 'ta': 'படிவங்கள்'},
            'Translate': {'hi': 'अनुवाद करें', 'bn': 'অনুবাদ', 'te': 'అనువదించు', 'ta': 'மொழிபெயர்'},
            'Legal Lok': {'hi': 'लीगल लोक', 'bn': 'লিগ্যাল লোক', 'te': 'లీగల్ లోక్', 'ta': 'லீகல் லோக்'}
        }
        # --- END MOCK TRANSLATIONS ---

        if fallback_only:
            print("Fallback-only request, using mock translations...")
        else:
            api_url = 'https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/compute'
            model_id = request_data.get('modelId', 'ai4bharat/indictrans-v2-all-gpu')
            task = request_data.get('task', 'translation')
            payload = {
                "modelId": model_id,
                "task": task,
                "input": [{
                    "source": source_text,
                    "sourceLanguage": source_lang,
                    "targetLanguage": target_lang
                }]
            }
            headers = {
                'ulcaApiKey': 'nEr9Swv6WxarqrQdP2Nafn04E7ZYncNPmJJEqMisDed5cDn62QcQWvQAQ6lcNe5o',
                'Content-Type': 'application/json'
            }
            try:
                response = requests.post(api_url, json=payload, headers=headers, timeout=30)
                response_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
                print("Response from ULCA API:", response_data)  # Debug log
                if response.status_code == 200 and response_data.get('output'):
                    output = response_data['output'][0]
                    return jsonify({
                        'target': output.get('target', source_text),
                        'status': 'success (api)',
                        'source': source_text,
                        'target_language': target_lang
                    })
            except Exception as api_error:
                print(f"API call failed: {api_error}")
                # Continue to mock fallback

        if source_text in mock_translations and target_lang in mock_translations[source_text]:
            translated_text = mock_translations[source_text][target_lang]
            return jsonify({
                'target': translated_text,
                'status': 'success (mock)',
                'source': source_text,
                'target_language': target_lang
            })
        else:
            return jsonify({
                'target': source_text,
                'status': 'no translation found',
                'source': source_text,
                'target_language': target_lang
            })
    except Exception as e:
        print(f"Translation error: {str(e)}")
        return jsonify({
            'error': 'Translation Error',
            'message': str(e),
            'target': source_text if 'source_text' in locals() else '',
            'status': 'error'
        })

# ----------------- GEMINI API -----------------
@app.route('/api/chat', methods=['POST'])
def chat_with_gemini():
    try:
        data = request.get_json()
        user_message = data.get('message')
        
        if not user_message:
            return jsonify({'error': 'No message provided'}), 400
            
        # Get the API key from environment variable
        gemini_api_key = os.getenv('GEMINI_API_KEY')
        if not gemini_api_key:
            return jsonify({'error': 'Gemini API key not configured'}), 500
            
        headers = {
            'Authorization': f'Bearer {gemini_api_key}',
            'Content-Type': 'application/json'
        }
        
        # Call Gemini API
        response = requests.post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
            headers=headers,
            json={
                "contents": [{
                    "parts": [{
                        "text": f"You are a legal assistant for Legal Lok. Please provide a helpful response to this legal question: {user_message}"
                    }]
                }]
            }
        )
        
        if response.status_code == 200:
            response_data = response.json()
            if 'candidates' in response_data and response_data['candidates']:
                bot_response = response_data['candidates'][0]['content']['parts'][0]['text']
                return jsonify({'response': bot_response})
            else:
                return jsonify({'error': 'Invalid response from Gemini API'}), 500
        else:
            return jsonify({'error': f'Gemini API error: {response.status_code}'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ----------------- RUN -----------------

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)
