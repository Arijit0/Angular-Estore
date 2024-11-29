import { InjectionToken } from "@angular/core";


export let APP_CONFIG = new InjectionToken("app.config");

export class AppConstants {


    public static get prodUrl(): string {return  'https://fakestoreapi.com';}
    
}