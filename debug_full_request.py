from app import create_app, db
from app.models import User

app = create_app()

with app.app_context():
    # Find a technician
    tech = User.query.filter_by(role='tecnico').first()
    if not tech:
        print("No technician found!")
        exit()
    print(f"Using technician: {tech.username} (ID: {tech.id})")
    
    # Use test client
    client = app.test_client()
    
    # Login as admin (assuming 'admin' exists and has password '123' or similar, 
    # but test_client login usually requires simulating session or login POST)
    
    # Actually, simpler: mock current_user via login_user context or just bypass login_required?
    # login_required is tough to bypass without login.
    
    # Let's try to login first.
    # Assuming 'admin' exists. I saw it in debug_roles.py.
    # But I don't know the password.
    # However, I can create a temporary user with known password.
    
    temp_user = User(username='debug_user', email='debug@test.com', role='admin')
    temp_user.set_password('123')
    db.session.add(temp_user)
    db.session.commit()
    
    # Login
    client.post('/auth/login', data={'username': 'debug_user', 'password': '123'}, follow_redirects=True)
    
    # Post to novo_chamado
    response = client.post('/novo', data={
        'title': 'Full Request Debug',
        'description': 'Testing route handling',
        'priority': 'media',
        'category': 'Hardware',
        'store_id': '1',
        'technician_id': str(tech.id),
        'status': 'novo'
    }, follow_redirects=True)
    
    print(f"Response status: {response.status_code}")
    # Check if ticket created
    from app.modules.chamados.models import Ticket
    ticket = Ticket.query.filter_by(title='Full Request Debug').first()
    if ticket:
        print(f"Ticket ID: {ticket.id}")
        print(f"Tech ID in DB: {ticket.technician_id}")
        if ticket.technician_id == tech.id:
            print("SUCCESS: Route handled technician_id correctly.")
        else:
            print("FAILURE: Route did NOT save technician_id.")
            
        # Cleanup
        db.session.delete(ticket)
    else:
        print("FAILURE: Ticket not created.")
        
    # Cleanup user
    db.session.delete(temp_user)
    db.session.commit()
