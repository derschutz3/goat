from .repository import StoreRepository
from app.modules.chamados.service import TicketService
from .models import Store

class StoreService:
    def __init__(self):
        self.repository = StoreRepository()
        self.ticket_service = TicketService()
    
    def get_all_stores_with_stats(self):
        return self.ticket_service.get_department_stats()

    def get_store_details(self, name):
        store = self.repository.find_by_name(name)
        if store:
            return {
                'name': store.name,
                'cnpj': store.cnpj or '',
                'address': store.address or '',
                'manager': store.manager or ''
            }
        return {'name': name, 'cnpj': '', 'address': '', 'manager': ''}

    def update_store(self, name, cnpj, address, manager):
        store = self.repository.find_by_name(name)
        if not store:
            store = Store(name=name)
        
        store.cnpj = cnpj
        store.address = address
        store.manager = manager
        
        return self.repository.save(store)
    
    def delete_store(self, name):
        store = self.repository.find_by_name(name)
        if store:
            self.repository.delete(store)
            return True
        return False
