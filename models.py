from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class FilledForm(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    form_id = db.Column(db.Integer, db.ForeignKey('form.id'), nullable=False)
    form_title = db.Column(db.String(255), nullable=False)
    form_data = db.Column(db.JSON, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = db.relationship('User', backref=db.backref('filled_forms', lazy=True))
    form = db.relationship('Form', backref=db.backref('filled_forms', lazy=True))
    
    def __repr__(self):
        return f'<FilledForm {self.id}: {self.form_title}>' 