import { Component } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { HeadComponent } from "../header/head/head.component";
import { CategoryComponent } from "../category/category.component";
import { ToastrService } from 'ngx-toastr';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MasterService } from '../services/master.service';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [HeadComponent, CategoryComponent,CommonModule,RouterLink],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.css'
})
export class ProductDetailsComponent {

  product: any;
  arrCartItems: any[] = [];
  isAddedToCart = false;

  constructor(
    private titleService: Title,
    private metaService: Meta,
    private toastr: ToastrService,
    private router: Router,
    private masterService: MasterService
  ) {}

  ngOnInit(): void {
    this.ProductDetails();
  }

  ProductDetails() {
    // const productId: any = this.route.snapshot.paramMap.get('id');
    
    if(!localStorage['productdetails']){
    } else {
      // const item = localStorage.getItem('productdetails') ? JSON.parse('productdetails') : null;
      this.product = this.masterService.fetchProductDetailsFromLocalStorage();
      // Set dynamic meta tags
      this.titleService.setTitle(this.product.title);
      this.metaService.addTags([
        { name: 'description', content: this.product.description },
        { property: 'og:title', content: this.product.title },
        { property: 'og:description', content: this.product.description },
        { property: 'og:image', content: this.product.image },
        // { property: 'og:url', content: window.location.href },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: this.product.title },
        { name: 'twitter:description', content: this.product.description },
        { name: 'twitter:image', content: this.product.image }
      ]);
      const items = this.masterService.cartItems();

      items.forEach((product: any) => {
         if (this.product.title == product.title) {
          this.isAddedToCart= true;
        }
       });
    }
  }

  addWishList() {
    this.toastr.error('Please login for wishlisting a product', 'Failed');
  }

  toggleCartAction() {
     // Check if the array exists in local storage
     const storedArray: any = localStorage.getItem('product');

     if (!this.isAddedToCart && storedArray) {
       // Parse the stored array from JSON string
       this.arrCartItems = JSON.parse(storedArray);
     } else {
      this.arrCartItems = [];
     }

     // Add the new item to the array
    this.arrCartItems.push(this.product);

    // Update the local storage with the new array
    this.masterService.storeCart(this.arrCartItems)

    this.router.navigate(['/viewcart']);
  }
}
