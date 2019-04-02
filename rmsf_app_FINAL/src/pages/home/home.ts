import { Component, NgZone } from '@angular/core';
import { NavController, NavPush, AlertController } from 'ionic-angular';
import { ToastController } from 'ionic-angular';
import { AdminPage } from '../admin/admin';
import { UserPage } from '../user/user';
import { RestProvider } from '../../providers/rest/rest';
import { Storage } from '@ionic/storage';
import * as CryptoJS from 'crypto-js';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})


/*
* HomePage - this is the page that first opens on the app. It presents the login form to be filled by the user
*
*/
export class HomePage {
  username: string = ""; //username of the login
  password: string = ""; // password written
  passHash: string = ""; // password transformed into a SHA1 hash
  token: string =""; // token of the connection. A token is an unique identifier that makes a session be kept between the user and a server
  isAdmin: boolean; // boolean to identify if the user is an admin or not

  data: any;
  serverUrl: string = "/users/login";

  constructor(public navCtrl: NavController, 
              private toastCtrl: ToastController,
              private ngZone: NgZone,
              private alertCtrl: AlertController,
              public restProvider: RestProvider,
              public storage: Storage
             ) {
  }

  
  //new login with restProvider creating a hash of the password with the SHA1 alghoritm 
  login(){
    var hash = CryptoJS.SHA1(this.password);
    this.passHash = CryptoJS.enc.Hex.stringify(hash);
    let body = {
      username: this.username,
      password: this.passHash
    };


// Here the login is processed by sending the username and password to the server ( with restProvider) 
// so that it can verify if they are on the database of users,  and if so,
 // the login is made and the page passes to admin/ user depending on the isAdmin flag saved on the database
    this.restProvider.request(this.serverUrl, body )
    .then(res => {
      this.data = res;
      this.token = this.data.token;
      this.storage.set('token', this.token);
      this.isAdmin = this.data.admin;
      this.storage.set('isAdmin', this.isAdmin);
      this.storage.set('username', this.username);
      this.storage.set('password', this.passHash);

      if(this.data.error == 0){
        if(this.isAdmin == true){
          this.navCtrl.setRoot(AdminPage, {}, {"animate": true, direction: 'forward'});    
        }else{
          this.navCtrl.setRoot(UserPage, {}, {"animate": true, direction: 'forward'});
        }
      }else{
        let title = "Invalid Login";
        let subtitle = "Username or password are incorrect. Please try again.";
        this.presentAlert(title, subtitle);
      }
    })
    .catch(err => {
      let title = "Server is offline";
      let subtitle = "Try to wait a few moments or contact the responsible for the app management.";
      this.presentAlert(title, subtitle);
      console.log("Server is not working correctly. Login attempt failed");
    });
  }

  // pops an alert saying if the login was successful or not when called 
  presentAlert(title, subtitle) {
    let alert = this.alertCtrl.create({
      title: title,
      subTitle: subtitle,
      buttons: ['Dismiss']
    });
    alert.present();
  }

}