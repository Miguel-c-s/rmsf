#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <BLE2902.h>
#include <WiFi.h>
#include <PubSubClient.h>

const char* ssid = "***REMOVED***";
const char* password = "***REMOVED***";

const char* mqttServer = "rmsf.hadrons.xyz";
const int mqttPort = 1883;
const char* mqttUser = "";
const char* mqttPassword = "";

char message_buffer[100];
char bluetooth_buffer[100];

WiFiClient espClient;
PubSubClient client(espClient);

#define SERVICE_UUID        "***REMOVED***"
#define CHARACTERISTIC_UUID "***REMOVED***"

#define S_ON 1
#define S_OFF 2
#define S_WAIT_UNLOCK_BL 3
#define S_REACTIVATE 4
#define S_BUZZER_ON 5

byte state = S_ON;
byte alarmState = 1;
byte waitTimer = 0;

#define BUZZER_PIN 23
int freq = 1000;
int channel = 0;
int resolution = 8;

int buzzerTime = 10;
int unlockTime = 10;
int reactivateTime = 10;

hw_timer_t * buzzerTimer = NULL;
hw_timer_t * unlockTimer = NULL;
hw_timer_t * reactivateTimer = NULL;

BLECharacteristic *pCharacteristic;
bool deviceConnected = false;
int received = 0;

byte unlocked = 0;
byte lock = 0;

#define MAGNETIC 18
#define PIR 22
int sensor = 0;


/*************************************************************
*                  Timers
*************************************************************/
void IRAM_ATTR buzzerOnTimer(){
  ledcWrite(channel, 0);
  Serial.println("Timer - buzzer off");
  timerStop(buzzerTimer);
  waitTimer = 0;
  state = S_ON;
}

void IRAM_ATTR unlockOnTimer(){
  Serial.println("Timer - unlock");
  timerStop(unlockTimer);
  waitTimer = 0;
  state = S_BUZZER_ON;
}

void IRAM_ATTR reactivateOnTimer(){
  Serial.println("Timer - reactivate");
  lock = 1;

  timerStop(reactivateTimer);

  waitTimer = 0;
  state = S_ON;
}


/*************************************************************
*                  MQTT Callback
*************************************************************/
void callback(char* topic, byte* payload, unsigned int length) {
  int i = 0;  
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");

  for(i = 0; i < length; i++){
    message_buffer[i] = (char)payload[i];
  }
  message_buffer[i] = '\0';
  Serial.println(message_buffer);

  if(!strcmp(topic, "buzzer")){
    if(!strcmp(message_buffer, "on")){ //TODO - options
      Serial.println("TODO - buzzer on");

      if(state == S_ON){
        state = S_BUZZER_ON;        
      }


    }else{
      Serial.println("TODO - buzzer off");
      ledcWrite(channel, 0);      
    }
    
  }else if(!strcmp(topic, "bluetooth/confirm")){
    if(!strcmp(message_buffer, "1")){
      received = 1;
      Serial.println("bluetooth ok");
    }else{
      received = 0;
      Serial.println("bluetooth wrong");          
    }
    
  }else if(!strcmp(topic, "configs")){
    String newValue = String(message_buffer);
    int delimiterIndex = newValue.indexOf(':');
    int secondDelimiterIndex = newValue.indexOf(':', delimiterIndex + 1);
    String v1 = newValue.substring(0, delimiterIndex);
    String v2 = newValue.substring(delimiterIndex + 1, secondDelimiterIndex);
    String v3 = newValue.substring(secondDelimiterIndex + 1); // To the end of the string
    buzzerTime = v1.toInt();
    unlockTime = v2.toInt();
    reactivateTime = v3.toInt();
    Serial.println(buzzerTime);
    Serial.println(unlockTime);
    Serial.println(reactivateTime);

    timerAlarmWrite(buzzerTimer, 1000000*buzzerTime, true);
    timerStop(buzzerTimer);

    timerAlarmWrite(unlockTimer, 1000000*unlockTime, true);
    timerStop(unlockTimer);

    timerAlarmWrite(reactivateTimer, 1000000*reactivateTime, true);
    timerStop(reactivateTimer);  
    
  }else if(!strcmp(topic, "state")){
    if(!strcmp(message_buffer, "0")){
      Serial.println("state = off");
      alarmState = 0;        
    }else if(!strcmp(message_buffer, "1")){
      Serial.println("state = on");
      alarmState = 1;          
    }
  }

}


/*************************************************************
*                  Bluetooth Callback onWrite
*************************************************************/
class MyCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) {
      std::string value = pCharacteristic->getValue();

      int i;
      if (value.length() > 0) {
        for (i = 0; i < value.length(); i++){
          bluetooth_buffer[i] = value[i];
        }
        bluetooth_buffer[i] = '\0';
        
        String newValue = (String)bluetooth_buffer;
        Serial.println("*********");
        Serial.print("New value: ");
        
        int delimiterIndex = newValue.indexOf(':');

        String user = newValue.substring(0, delimiterIndex);
        String pass = newValue.substring(delimiterIndex + 1);

        Serial.println("user = " + user);
        Serial.println("pass = " + pass);
        
        Serial.println("*********");

        client.publish("bluetooth/login", bluetooth_buffer);
      }

    }
};


/*************************************************************
*                  Bluetooth Callback onConnect
*************************************************************/
class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
    };

    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
    }
};


/*************************************************************
*                  Setup
*************************************************************/
void setup() {
  Serial.begin(115200);
  pinMode(22, INPUT_PULLUP);
  pinMode(18, INPUT_PULLUP); //MAGNETIC
  pinMode(19, INPUT_PULLUP); //PIR
  

  //buzzer
  ledcSetup(channel, freq, resolution);
  ledcAttachPin(BUZZER_PIN, channel);
  ledcWrite(channel, 0);

  //timers
  buzzerTimer = timerBegin(0, 80, true); //buzzer
  timerAttachInterrupt(buzzerTimer, &buzzerOnTimer, true);
  timerAlarmWrite(buzzerTimer, 1000000*buzzerTime, true);
  timerAlarmEnable(buzzerTimer);
  timerStop(buzzerTimer);

  unlockTimer = timerBegin(1, 80, true); //time to check bluetooth
  timerAttachInterrupt(unlockTimer, &unlockOnTimer, true);
  timerAlarmWrite(unlockTimer, 1000000*unlockTime, true);
  timerAlarmEnable(unlockTimer);
  timerStop(unlockTimer);

  reactivateTimer = timerBegin(3, 80, true); //time to reactivate the alarm
  timerAttachInterrupt(reactivateTimer, &reactivateOnTimer, true);
  timerAlarmWrite(reactivateTimer, 1000000*reactivateTime, true);
  timerAlarmEnable(reactivateTimer);
  timerStop(reactivateTimer);  
    
  //WiFi connection
  WiFi.begin(ssid, password);
  while(WiFi.status() != WL_CONNECTED){
    delay(500);
    Serial.println("Connecting to WiFi..");
  }
 
  Serial.println("Connected to the WiFi network");

  //MQTT connection
  client.setServer(mqttServer, mqttPort);
  client.setCallback(callback);
 
  while(!client.connected()){
    Serial.println("Connecting to MQTT...");
    if(client.connect("ESP32Client", mqttUser, mqttPassword)){
      Serial.println("connected");
    }else{
      Serial.print("failed with state ");
      Serial.print(client.state());
      delay(2000);
    }
  }

  //MQTT subscriptions
  client.subscribe("buzzer");
  client.subscribe("configs");
  client.subscribe("state");
  client.subscribe("bluetooth/confirm");

  //Get configs from the server
  client.publish("startup", "");
  
  client.publish("esp/test", "Hello from ESP32"); //test

  //Bluetooth settings
  BLEDevice::init("MyESP32");
  BLEServer *pServer = BLEDevice::createServer();
  delay(100);
  pServer->setCallbacks(new MyServerCallbacks());
  BLEService *pService = pServer->createService(SERVICE_UUID);
  delay(100);
  pCharacteristic = pService->createCharacteristic(
                                         CHARACTERISTIC_UUID,
                                         BLECharacteristic::PROPERTY_READ   |
                                         BLECharacteristic::PROPERTY_WRITE  |
                                         BLECharacteristic::PROPERTY_NOTIFY |
                                         BLECharacteristic::PROPERTY_INDICATE
                                       );
  delay(100);
  //Create a BLE Descriptor
  pCharacteristic->addDescriptor(new BLE2902());

  delay(100);
  pCharacteristic->setCallbacks(new MyCallbacks());

  pCharacteristic->setValue("Locked");
  pService->start();

  delay(100);
  BLEAdvertising *pAdvertising = pServer->getAdvertising();
  pAdvertising->start();
}


/*************************************************************
*                  Loop
*************************************************************/
void loop() {
  //Serial.println(digitalRead(18));
  if(state == S_ON){
    if(alarmState == 1){
      if(received == 1){//falta mudar a função que mete isto a 1
        pCharacteristic->setValue("Unlocked");
        pCharacteristic->notify();
        client.publish("esp/test", "Unlocked");
        received = 0;
        state = S_REACTIVATE;
      }
      if(!digitalRead(22)){//botao teste
        state = S_WAIT_UNLOCK_BL;
        Serial.println("botao");
      }
      if(digitalRead(18)){// MAGNETIC
        sensor = MAGNETIC;
        state = S_WAIT_UNLOCK_BL;        
        Serial.println("MAGNETIC");
      }    
      if(digitalRead(19)){//PIR
        sensor = PIR;        
        state = S_WAIT_UNLOCK_BL;
        Serial.println("PIR");
      }         
    }else{
      state = S_OFF;
    }
  }else if(state == S_REACTIVATE){
    if(reactivateTime == 0){
      alarmState = 0;
      state = S_OFF;
    }
    else if(reactivateTime > 0 && waitTimer == 0){
      timerRestart(reactivateTimer);
      waitTimer = 1;      
    }
    
  }else if(state == S_WAIT_UNLOCK_BL){
    if(waitTimer == 0){
      timerRestart(unlockTimer);      
      waitTimer = 1;
    }
    if(received == 1){//falta mudar a função que mete isto a 1
      timerStop(unlockTimer);
      pCharacteristic->setValue("Unlocked");
      pCharacteristic->notify();
      received = 0;
      state = S_REACTIVATE;
      waitTimer = 0;
    }    
    
  }else if(state == S_BUZZER_ON){
    if(waitTimer == 0){
      if(sensor == MAGNETIC){
        client.publish("sensor", "magnetic");
      }else if(sensor == PIR){
        client.publish("sensor", "pir");
      }
      Serial.println("Buzzer timer on");
      ledcWrite(channel, 128);
      timerRestart(buzzerTimer);
      waitTimer = 1; 
    }
   
  }else if(state == S_OFF){
    if(alarmState == 0){

    }else{
      state = S_ON;
    }    
  }

  if(lock){
    pCharacteristic->setValue("Locked");
    pCharacteristic->notify();
    lock = 0;
  }
  
  client.loop();
}
