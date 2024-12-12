import { Routes } from '@angular/router';
import { CartComponent } from './cart/cart.component';
import { HomeComponent } from './home/home.component';
import { ProductDetailsComponent } from './product-details/product-details.component';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { PersonalInfoComponent } from './personal-info/personal-info.component';
import { authGuard } from './auth.guard';
import { authRedirectGuardGuard } from './auth-redirect-guard.guard';
import { CheckoutComponent } from './checkout/checkout.component';

export const routes: Routes = [
    {path: '', pathMatch:'full', component: HomeComponent},
    { path: 'category/:categoryName' , component: HomeComponent},
    { path: 'search/:query' , component: HomeComponent},
    {path: 'viewcart', pathMatch:'full', component: CartComponent},
    { path: 'products/:id/:title', component: ProductDetailsComponent },
    { path: 'login', pathMatch:'full', component: LoginComponent, canActivate: [authRedirectGuardGuard] },
    { path: 'signup', pathMatch:'full', component: SignupComponent, canActivate: [authRedirectGuardGuard] },
    { path: 'personal-info/:section', component: PersonalInfoComponent, canActivate: [authGuard] },
    { path: 'checkout', component: CheckoutComponent, canActivate: [authGuard],data: { requiredInit: true }, }
    // { path: '', redirectTo: '/personal-info/account', pathMatch: 'full' },
    // { path: '**', redirectTo: '/personal-info/account' },
    // { path: '**', redirectTo: "" }
];

// { queryParams: { init: 'view=FLIPKART', loginFlow: 'false' }
