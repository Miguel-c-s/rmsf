import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { BLE } from '@ionic-native/ble';

import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { AdminPage } from '../pages/admin/admin';
import { UserPage } from '../pages/user/user';
import { LogsPage } from '../pages/logs/logs';
import { BlePage } from '../pages/ble/ble';
import { ConfigsPage } from '../pages/configs/configs';

//NEW
import { HttpModule } from '@angular/http';
import { RestProvider } from '../providers/rest/rest';
import { IonicStorageModule } from '@ionic/storage';

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    AdminPage,
    UserPage,
    LogsPage,
    BlePage,
    ConfigsPage,
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    IonicStorageModule.forRoot(),
    HttpModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    AdminPage,
    UserPage,
    LogsPage,
    BlePage,
    ConfigsPage,
  ],
  providers: [
    StatusBar,
    SplashScreen,
    BLE,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    RestProvider
  ]
})
export class AppModule {}
