import { Component } from '@angular/core';
import { AddressbookService } from '../addressbook/addressbook.service';
import { Platform } from '@ionic/angular';
import { Contact } from '@ionic-native/contacts/ngx';

@Component({
   selector: 'app-tab2',
   templateUrl: 'tab2.page.html',
   styleUrls: ['tab2.page.scss']
})
export class Tab2Page {

   private userUuid: String;
   private allContacts: Array<Contact>;

   constructor(private addressbookService: AddressbookService, private platform: Platform) {
      console.info('Tab2Page constructor');

      //TODO: probably not necessary, but leave for now
      this.platform.ready().then((readySource) => {
         // Platform now ready, execute any required native code
         console.log('Platform ready from', readySource);
         this.getContacts();
      });
   }

   getContacts() {
      this.addressbookService.getAllAddressbookContacts().then(
         (contactsFound) => {
            this.allContacts = contactsFound;
         }
      );
   }
}
