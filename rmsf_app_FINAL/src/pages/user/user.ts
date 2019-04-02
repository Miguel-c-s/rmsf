import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ModalController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { HomePage } from '../home/home';
import { BlePage } from '../ble/ble';

@IonicPage()
@Component({
  selector: 'page-user',
  templateUrl: 'user.html',
})


/*
* UserPage - simple page for users with basic access to unlock alarm through BLE only
*
*/
export class UserPage {

  constructor(public navCtrl: NavController, 
              public navParams: NavParams, 
              public storage: Storage,
              public modalCtrl: ModalController
            ) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad UserPage');
  }

  // logout function as in admin
  logout(){
    this.storage.clear().then(() => {
      this.navCtrl.goToRoot({"animate": true, direction: 'back'});
    });
  }

  // connect function to connect from the app to the microcontroller through BLE (bluetooth low energy)
  connect(){
    let profileModal = this.modalCtrl.create(BlePage, { userId: 8675309 });
    profileModal.present();  
  }

}
