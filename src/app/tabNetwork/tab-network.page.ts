import { Component } from '@angular/core';
import { NetworkStoreService } from '../networkStore/networkStore.service';
import { ProfileService } from '../profile/service/profile.service';
import { ToastService } from '../toast/toast.service';

@Component({
   selector: 'app-tab-network',
   templateUrl: './tab-network.page.html',
   styleUrls: ['./tab-network.page.scss'],
})
export class TabNetworkPage {

   displayedContacts: any[];
   sending: boolean;

   constructor(private networkStoreService: NetworkStoreService, public toastService: ToastService,
      private profileService: ProfileService) { }

   sendProfileToNetwork() {
      this.sending = true;

      this.profileService.sendProfileToNetwork(() => {
         this.sending = false;
         this.toastService.presentToast('Profile Successfully Sent to Network!', 'success');
      }, (error) => {
         this.sending = false;
         if (error) {
            this.toastService.presentToast(error, 'danger');
         } else {
            this.toastService.presentToast('Send failed, try back later', 'danger');
         }
      });
   }

   async clearNetworkSelections() {
      this.networkStoreService.clearAllNetworkContacts();
      this.loadInNetworkContacts();
   }

   ionViewDidEnter() {
      this.loadInNetworkContacts();
   }

   async removeFromNetwork(contact) {
      await this.networkStoreService.removeNetworkContact(contact);
      this.loadInNetworkContacts();
   }

   async loadInNetworkContacts() {
      this.displayedContacts = await this.networkStoreService.getUBDatabaseOfContacts();
   }
}
