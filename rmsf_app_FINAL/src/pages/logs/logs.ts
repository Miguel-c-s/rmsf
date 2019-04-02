import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { RestProvider } from '../../providers/rest/rest';
import { Storage } from '@ionic/storage';


@IonicPage()
@Component({
  selector: 'page-logs',
  templateUrl: 'logs.html',
})


/*
* LogsPage - retrieves the logs from the database and displays them in a list to the admin
*
*/
export class LogsPage {

  data: any;
  public jsonObject: any;

  constructor(public navCtrl: NavController, 
              public navParams: NavParams,
              public restProvider: RestProvider,
              public storage: Storage
            ) {
  }

 // at the loading of the page, saved logs are requested from the database so that they can be displayed to the user
  ionViewDidLoad() {
    console.log('ionViewDidLoad LogsPage');
    this.reqLogs();
  }

  //This is the function which makes the request, using restProvider to access the database
  reqLogs(){
    var serverUrl= "/admin/logs";

    this.storage.get('token').then((token) => {
      let body = {token: token,};
      this.restProvider.request(serverUrl, body)
      .then(res => {
        let dataRes: any = res;
        this.data = dataRes.data;
      });
    });
  }

}
