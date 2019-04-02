import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ModalController } from 'ionic-angular';
import { LogsPage } from '../logs/logs';
import { ConfigsPage } from '../configs/configs';
import { Storage } from '@ionic/storage';
import { HomePage } from '../home/home';
import { BlePage } from '../ble/ble';
import { RestProvider } from '../../providers/rest/rest';


@IonicPage()
@Component({
  selector: 'page-admin',
  templateUrl: 'admin.html',
})
/*
* AdminPage is the page to where the login goes if the user has admin access. Here the admin has 
* the ability to control the system from afar
*
*/
export class AdminPage {
  logsPage = LogsPage; // page name attribution
  configsPage = ConfigsPage; // page name attribution
  
  constructor(public navCtrl: NavController, 
              public navParams: NavParams, 
              public restProvider: RestProvider,
              public storage: Storage,
              public modalCtrl: ModalController
            ) {
  }

  // this action is done when the page is loaded (default function from ionic)
  ionViewDidLoad() {
    console.log('ionViewDidLoad AdminPage');     
  }


  // Function to enable alarm through wifi ( admin account only)
enableAlarm(){

    var serverUrl= "/admin/enableAlarm";

    this.storage.get('token').then((token) => {
      let body = {
        token: token,
      };

      this.restProvider.request(serverUrl, body).catch((err)=> {
        console.log("couldn't enable alarm");
  
      });
     
    });
}

// Function to disable alarm through wifi ( admin account only) 
disableAlarm(){

  var serverUrl= "/admin/disableAlarm";

  this.storage.get('token').then((token) => {
    let body = {
      token: token,
    };

    this.restProvider.request(serverUrl, body).catch((err)=> {
      console.log("couldn't disable alarm");

    });
   
  });
}

// Function to activate the buzzer even if no sensor has been triggered
buzzer(){ // activate buzzer
  var serverUrl= "/admin/buzzer";

  this.storage.get('token').then((token) => {
    let body = {
      token: token,
    };// WIFI (buzzer  a)

    this.restProvider.request(serverUrl, body).catch((err)=> {
      console.log("couldn't activate buzzer");

    });
   
  });

}

// direct connection to "esp controller", calls function in BLE to make a connection
  connect(){
    let profileModal = this.modalCtrl.create(BlePage, { userId: 8675309 });
    profileModal.present();  
  }

// logs out of the app when called
logout(){
  this.storage.clear().then(() => {
    this.navCtrl.goToRoot({"animate": true, direction: 'back'});
  });
}


}
