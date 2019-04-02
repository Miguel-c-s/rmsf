import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import 'rxjs/add/operator/map';

@Injectable()
export class RestProvider {


  constructor(public http: Http) {
  }


  //the addr to which the connection is made , addr, is the address and port of the server plus the specific page where 
  //the server is listening to some specific information, depending on where restProvider was called.
  request( serverUrl, body){
    let headers = new Headers();
    headers.append('Content-Type', 'application/json');
    var addr = "http://rmsf.hadrons.xyz:3000"+ serverUrl;
    // serverURL is a "string" and addr a "var"
    // not sure about possible conflicts. It is working for now. http://localhost:3000

    // this posts in json to server a request
    
    return new Promise((resolve, reject) => {
      this.http.post(addr, JSON.stringify(body),{headers: headers})
      .map(res => res.json())
      .subscribe(data => {
          resolve(data);
        }, err => {
          reject(err);
      });    
    });
  }

}
