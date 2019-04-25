import { Injectable, NgZone } from '@angular/core';
import { Deeplinks } from '@ionic-native/deeplinks/ngx';
import { NavController, ToastController } from '@ionic/angular';
import { DebugService } from '../debug/debug.service';
import { ModalController } from '@ionic/angular';
import { ContactUpdatePage } from '../contacts/contact-update/contact-update.page';
import { ContactsService } from '../contacts/contacts.service';
import { DeltasService } from '../contacts/deltas/deltas.service';

// DEBUG:
// generate base64 hash of contact object with updates:
// > btoa(JSON.stringify({"displayName":"John Bassett","phoneNumbers":[{"value":"9417163554"}], "addresses":[{"value":"2481 appalachian dr, melbourne Fl, 32939"}]}));
// clear out phone numbers for "John Bassett" contact: 
// > adb shell am start -a android.intent.action.VIEW -d "https://fractalstack.com/upbook/intent?updates=eyJkaXNwbGF5TmFtZSI6IkpvaG4gQmFzc2V0dCIsInBob25lTnVtYmVycyI6W119"
// Send command to mimic link click: 
// > adb shell am start -a android.intent.action.VIEW -d "https://fractalstack.com/upbook/intent?updates=
@Injectable({
   providedIn: 'root'
})
export class DeeplinkService {

   constructor(protected deeplinks: Deeplinks, protected navController: NavController, private zone: NgZone,
      private debugService: DebugService, private modalController: ModalController, private contactsService: ContactsService,
      public toastController: ToastController, private deltaService: DeltasService) { }

   setupDeepLinkRouting() {
      this.deeplinks.route({
         '/upbook/intent': 'contact-update'
      }).subscribe(match => {
         this.contactUpdateIntentMatch(match);
      }, nomatch => {
         console.error('Got a deeplink that didn\'t match', nomatch);
      });
   }

   // match.$route - the route we matched, which is the matched entry from the arguments to route()
   // match.$args - the args passed in the link
   // match.$link - the full link data
   async contactUpdateIntentMatch(match) {
      this.debugService.add("DeeplinkService.setupDeepLinkRouting: Successfully matched route:");
      this.debugService.add(match);

      // parse raw query string into update object
      var contactUpdates = this.parseContactQueryString(match.$link.queryString);

      const contactWithUpdatesAndDeltas = await this.deltaService.buildContactWithDeltasAndUpdates(contactUpdates);
      console.log(contactWithUpdatesAndDeltas);

      this.modalController.create({
         component: ContactUpdatePage,
         componentProps: contactWithUpdatesAndDeltas
      }).then((modal) => {
         modal.present();
         this.debugService.add("DeeplinkService.setupDeepLinkRouting: Successfully navigated to route.");

         modal.onDidDismiss().then(data => {
            if (data.data.save === true) {
               this.presentToast('Saving contact updates, please wait...', 'secondary');
               this.contactsService.updateContact(contactUpdates).then((updatedContact) => {
                  if (updatedContact == undefined) {
                     this.presentToast('Failed to save contact updates, manually update', 'danger');
                  } else {
                     this.presentToast('Successfully saved updates!', 'success');
                  }
               });
            }
         });
      });
   }

   //TODO: build a simple object with the contact fields that we are tracking
   parseContactQueryString(queryStringWithUpdates) {
      var searchParams = new URLSearchParams(queryStringWithUpdates);
      var base64ContactUpdates = searchParams.get('updates');
      console.log(base64ContactUpdates);

      var decodedUpdate = atob(base64ContactUpdates);
      console.log(decodedUpdate);

      var decodedAndParsedContactUpdates = JSON.parse(decodedUpdate);
      //console.log(decodedAndParsedContactUpdates);
      return decodedAndParsedContactUpdates;
   }

   async presentToast(message, color) {
      const toast = await this.toastController.create({
         message: message,
         duration: 3000,
         color: color
      });
      toast.present();
   }
}
