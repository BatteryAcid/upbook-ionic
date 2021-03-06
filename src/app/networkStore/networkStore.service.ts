import { Injectable } from '@angular/core';
import { Contacts, Contact, ContactField, ContactName } from '@ionic-native/contacts/ngx';
import { Platform } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { DebugService } from '../debug/debug.service';
import * as _ from 'lodash';
import { ContactsService } from '../contacts/contacts.service';

@Injectable({
   providedIn: 'root'
})
export class NetworkStoreService {

   private readonly UB_ADDRESS_BOOK_CONTACTS_KEY = 'UB_ADDRESS_BOOK_CONTACTS';

   private isNative: Boolean = false; //TODO: comment out this check for production release

   private allDeviceContacts;

   constructor(private contacts: Contacts, public storage: Storage, private platform: Platform, private debugService: DebugService,
      private contactsService: ContactsService) {

      this.platform.ready().then(() => {
         this.debugService.add("AddressbookService.constr: platform ready.");
         if (this.platform.is('cordova')) {
            // native API
            this.isNative = true;
         }
      });
   }

   async flagDeviceContactsInNetwork(ubContacts) {
      // ensures the allDeviceContacts has been set.
      await this.getAllAddressbookContactsFromDevice();

      if (ubContacts) {
         this.allDeviceContacts.map(deviceCont => {
            const inNetworkCont = ubContacts.filter(ubCont => ubCont.id === deviceCont.id);
            if (inNetworkCont && inNetworkCont.length > 0) {
               deviceCont.inNetwork = true;
            } else {
               deviceCont.inNetwork = false;
            }
         });
      }
   }

   async updateMultipleUBContacts(contactsToUpdate: Array<Contact>) {
      try {
         const contactsForUpdate = await this.getUBDatabaseOfContacts();
         contactsToUpdate.map(contactToUpdate => {
            let filteredContactToUpdateIndex = contactsForUpdate.findIndex(contact => contact.id == contactToUpdate.id);
            if (filteredContactToUpdateIndex > -1) {
               contactsForUpdate[filteredContactToUpdateIndex] = this.parseContactObjectInstanceOutIntoOwnObject(contactToUpdate);
            }
         });
         this.saveContactsToStore(contactsForUpdate);
      } catch (error) {
         return Promise.reject(undefined);
      }
   }

   // establishes device contacts object or returns if it's already been set for this session
   async getAllAddressbookContactsFromDevice(): Promise<Contact[]> {
      //TODO: comment out this check for production release
      if (this.isNative === true) {
         if (!this.allDeviceContacts || this.allDeviceContacts.length < 1) {
            const deviceContacts = await this.contactsService.queryAllDeviceContacts();
            this.allDeviceContacts = deviceContacts;
            return Promise.resolve(this.allDeviceContacts);
         } else {
            //we already have queried and stored the device contacts, just return list
            return Promise.resolve(this.allDeviceContacts);
         }
      } else {
         return this.returnMockContacts();
      }
   }

   private parseJsonStringIntoContactsArray(contactsJsonString: string) {
      let parsedResults = JSON.parse(contactsJsonString);
      let extractedContacts = parsedResults.map(contact => {
         if (contact != null) {
            //pull out contact object from _objectInstance before saving
            if (contact["_objectInstance"] != null || contact["_objectInstance"] != undefined) {
               const contactNumber = contact.contactNumber;
               contact = <Contact>contact["_objectInstance"];
               contact.contactNumber = contactNumber;
               return contact;
            } else {
               //otherwise contact object is already parsed
               return contact;
            }
         }
      });
      return extractedContacts;
   }

   parseContactObjectInstanceOutIntoOwnObject(contactToParse: Contact) {
      if (contactToParse["_objectInstance"] != null || contactToParse["_objectInstance"] != undefined) {
         let parsedContact = contactToParse["_objectInstance"];
         //capture all UB custom fields after parse
         parsedContact.inNetwork = contactToParse.inNetwork;
         parsedContact.contactNumber = contactToParse.contactNumber;
         return parsedContact;
      } else {
         return contactToParse;
      }
   }

   isMaximumNetworkContactsSelected(selectedNetworkSize, maxNetworkSize): boolean {
      if (selectedNetworkSize === maxNetworkSize) {
         return true;
      }
      return false;
   }

   async getUBDatabaseOfContacts(): Promise<any[]> {
      return this.storage.get(this.UB_ADDRESS_BOOK_CONTACTS_KEY);
   }

   async getContactFromUBNetwork(contactToRetrieve): Promise<any[]> {
      let ubNetworkContacts = await this.getUBDatabaseOfContacts();
      if (ubNetworkContacts) {
         const contactFromUbNetwork = ubNetworkContacts.filter(netContact => netContact.id == contactToRetrieve.id);
         return contactFromUbNetwork;
      }
      return undefined;
   }

   saveContactsToStore(contactsToSave: Contact[]) {
      let parsedContactsToSave = this.parseJsonStringIntoContactsArray(JSON.stringify(contactsToSave))
      this.storage.set(this.UB_ADDRESS_BOOK_CONTACTS_KEY, parsedContactsToSave);
   }

   async removeNetworkContact(contactToRemove) {
      let ubNetworkContacts = await this.getUBDatabaseOfContacts();
      const updatedNetworkList = ubNetworkContacts.filter(netContact => netContact.id != contactToRemove.id);
      this.saveContactsToStore(updatedNetworkList);
      this.flagDeviceContactsInNetwork(updatedNetworkList);
   }

   clearAllNetworkContacts() {
      this.storage.set(this.UB_ADDRESS_BOOK_CONTACTS_KEY, []);
   }

   clearSessionDeviceContacts() {
      this.allDeviceContacts = [];
   }

   //TODO: comment out this check for production release
   async returnMockContacts(): Promise<Contact[]> {
      //cannot use contact create API here, won't work correctly

      //mock standard user
      let testContact = new Contact();
      let mockContact = Object.assign({}, testContact);
      mockContact.id = "1234567890";
      mockContact.rawId = null;
      mockContact.displayName = null;
      mockContact.name = new ContactName(null, 'Smith', 'Tom');
      mockContact.nickname = null;
      mockContact.phoneNumbers = [new ContactField('mobile', '321-475-9999')];
      mockContact.emails = [new ContactField('personal', 'tomsmith@upbook.com')];
      mockContact.addresses = null;
      mockContact.ims = null;
      mockContact.organizations = null;
      mockContact.birthday = null;
      mockContact.note = null;
      mockContact.photos = null;
      mockContact.categories = null;
      mockContact.urls = null;

      //mock contact for empty name.  Tests html template.
      let testContact2 = new Contact();
      let mockContact2 = Object.assign({}, testContact2);
      mockContact2.id = "1234444444";
      mockContact2.rawId = null;
      mockContact2.displayName = null;
      // mockContact2.name = new ContactName(null, 'Joe', 'Desk');
      mockContact2.nickname = null;
      mockContact2.phoneNumbers = [new ContactField('mobile', '321-555-55555')];
      mockContact2.emails = [new ContactField('personal', 'joedesk@upbook.com')];
      mockContact2.addresses = null;
      mockContact2.ims = null;
      mockContact2.organizations = null;
      mockContact2.birthday = null;
      mockContact2.note = null;
      mockContact2.photos = null;
      mockContact2.categories = null;
      mockContact2.urls = null;

      return await [mockContact, mockContact2];
   }
}
