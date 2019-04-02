import { Component, NgZone } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { RestProvider } from '../../providers/rest/rest';

/**
 * Generated class for the ConfigsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-configs',
  templateUrl: 'configs.html',

})
/*
* ConfigsPage - page where the admin can change the configurated times on the system and save them to the server
*
*/
export class ConfigsPage {


  buzzTime: string = ""; // Time that the buzzer will be on if an alarm is activated / if the admin chooses to
  connectTime: string = ""; //Time that a user has to deativate the bluetooth after a sensor has detected an intrusion
  alarmReactivate: string = "";//Time that the alarm takes to reactivate after being disable by bluetooth (BLE)
   // IMPORTANT NOTE:  If alarmReactivate is 0, any bluetooth connection will disable the alarm until it is reactivated by the admin!
   // (will have the same result as admin function alarmDisable (wifi))
  serverUrl: string = "/admin/configs"; // the url where to send the configs to in the server
  data: any; // structure received from the server with all the values of the time variables above




  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    public restProvider: RestProvider,
    public storage: Storage,
    private ngZone: NgZone,
    private alertCtrl: AlertController,

  ) {
  }


  // called when the page is loaded. we get the token saved on storage associated with current connection
// Also retrieve the previous configurations saved on the server so that we can display them to the user
  ionViewDidLoad() {

    var newUrl = "/admin/savedInfo";

    this.storage.get('token').then((token) => {
      let body = {
        token: token,
      };

      this.restProvider.request(newUrl, body)
        .then(res => {
          this.data = res;
          if (this.data.error == 0) {
            this.buzzTime = this.data.buzzTime;
            this.connectTime = this.data.connectTime;
            this.alarmReactivate = this.data.alarmReactivate;
          } else {

          }
        })
        .catch((err) => {
          console.log("could not get configs info");
          let title = "Error reaching server";
          let subtitle = "";
          this.presentAlert(title, subtitle);
        });

    });
    //console.log('ionViewDidLoad ConfigsPage');


  }



 // This function is called when the admin presses the key to save the new configurations.
 // It is sent to the server the new configurations
  saveConfigs() {
    // not changing values in the range knobs yet!

    this.storage.get('token').then((token) => {
      let body = {
        token: token,
        buzzTime: this.buzzTime,
        connectTime: this.connectTime,
        alarmReactivate: this.alarmReactivate,

      };

      this.restProvider.request(this.serverUrl, body)
        .then(res => {
          this.data = res;
          if (this.data.error == 0) {
            let title = "Configurations changed successfully!";
            let subtitle = "";
            this.presentAlert(title, subtitle);
          } else {
            let title = "Error loading configurations";
            let subtitle = "";
            this.presentAlert(title, subtitle);
          }
        })
        .catch((err) => {
          console.log("could not change configurations");
          let title = "Error reaching server";
          let subtitle = "";
          this.presentAlert(title, subtitle);
        });

    });
  }

  // function to make a popup to the user saying the result of the attempt to change configurations
  // as it can be seen in the previous function messages of success or error are sent.
  presentAlert(title, subtitle) {
    let alert = this.alertCtrl.create({
      title: title,
      subTitle: subtitle,
      buttons: ['Dismiss']
    });
    alert.present();
  }

}
