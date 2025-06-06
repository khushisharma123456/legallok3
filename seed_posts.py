from app import app, db, Post, User
from datetime import datetime, timedelta

def seed_posts():
    with app.app_context():
        # Get the first user (or create one if none exists)
        user = User.query.first()
        if not user:
            print("No users found in the database. Please create a user first.")
            return

        # Sample posts data
        dummy_posts = [
            {
                'title': 'Understanding Employment Contracts',
                'content': '''Hello everyone! I'm new to the legal field and would like to understand more about employment contracts. 
                What are the key elements that should be included in a standard employment contract? 
                Any advice would be greatly appreciated!''',
                'created_at': datetime.now() - timedelta(days=2)
            },
            {
                'title': 'Tips for Filing a Legal Petition',
                'content': '''I've been working on filing a legal petition and wanted to share some tips I've learned:
                1. Always double-check all personal information
                2. Include all relevant dates and timelines
                3. Be clear and concise in your statements
                4. Attach all necessary supporting documents
                Does anyone have additional tips to share?''',
                'created_at': datetime.now() - timedelta(days=5)
            },
            {
                'title': 'Legal Document Templates - Best Practices',
                'content': '''When using legal document templates, it's important to:
                - Review the entire document before signing
                - Understand each clause and its implications
                - Keep a copy for your records
                - Consider consulting with a legal professional
                What other best practices do you follow?''',
                'created_at': datetime.now() - timedelta(days=7)
            },
            {
                'title': 'Common Mistakes in Legal Forms',
                'content': '''I've noticed several common mistakes people make when filling out legal forms:
                1. Missing signatures
                2. Incomplete information
                3. Using outdated forms
                4. Not reading the fine print
                Let's discuss how to avoid these pitfalls!''',
                'created_at': datetime.now() - timedelta(days=10)
            },
            {
                'title': 'Digital vs. Physical Legal Documents',
                'content': '''With the rise of digital documentation, what are your thoughts on digital vs. physical legal documents?
                Pros of digital:
                - Easier to store and access
                - Environmentally friendly
                - Quick to share
                Cons:
                - Security concerns
                - Digital signature validity
                - Technical issues
                What's your preference?''',
                'created_at': datetime.now() - timedelta(days=12)
            }
        ]

        # Add posts to database
        for post_data in dummy_posts:
            post = Post(
                title=post_data['title'],
                content=post_data['content'],
                created_at=post_data['created_at'],
                user_id=user.id
            )
            db.session.add(post)

        try:
            db.session.commit()
            print("Successfully added dummy posts to the database!")
        except Exception as e:
            db.session.rollback()
            print(f"Error adding dummy posts: {str(e)}")

if __name__ == "__main__":
    seed_posts() 