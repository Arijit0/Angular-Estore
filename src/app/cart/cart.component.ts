import { Component, OnInit } from '@angular/core';
import { HeadComponent } from "../header/head/head.component";
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MasterService } from '../services/master.service';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-cart',
    imports: [HeadComponent, FormsModule, CommonModule, NgxSkeletonLoaderModule],
    templateUrl: './cart.component.html',
    styleUrl: './cart.component.css'
})
export class CartComponent implements OnInit {

  iscartEmpty: boolean = true;
  allcartItems: any[] = [];
  total: number = 0;
  qty: number = 1;
  modal: any;

  constructor(
    private router: Router,
    private masterService: MasterService,
    private toastr: ToastrService
  ){}

  ngOnInit(): void {
    this.cartItems();
  }

  cartItems() {
    if(!this.masterService.cartItems() || this.masterService.cartItems().length == 0) {
      this.iscartEmpty = true;
    } else {
      // const item = localStorage.getItem('productdetails') ? JSON.parse('productdetails') : null;
      this.allcartItems = this.masterService.cartItems();
      this.calculateTotal();
      this.iscartEmpty = false;
    }
  }

  goTohome() {
    this.router.navigate(['/']);
  }

  removeItem(i: number,confirmValue: any,item: any) {
     if (i !== -1 && confirmValue) {
      this.allcartItems.splice(i, 1);
      this.masterService.storeCart( this.allcartItems);
      this.cartItems();
      this.modal.hide();
      this.toastr.success(`Successfully removed ${item.title} from your cart`);
     }
  }

  GoToProductDetailsPage(item: any) {
    this.router.navigate(['/products', item.id, item.title]);
    this.masterService.sendProductDetailsToLocalStorage(item);
  }

  incrementQuantity(item: any): void {
    item.quantity ++;
    this.finalcart(item);
  }

  decrementQuantity(item: any): void {
    if (item.quantity > 1) {
      item.quantity --;
      this.finalcart(item);
    }
  }

  calculateTotal(): void {
    this.total = this.allcartItems.reduce((acc, item) => {
      return acc + (item.price * item.quantity);
    }, 0);
  }

  finalcart(item: any) {
    this.allcartItems.forEach((element,index) => {
      if(element.title == item.title) {
        this.allcartItems[index].quantity = item.quantity;
          this.masterService.storeCart( this.allcartItems);
          this.iscartEmpty = true;
          this.toastr.success(`You've changed ${this.allcartItems[index].title} QUANTITY to '${item.quantity}'`);
          this.cartItems();
      }
    });
  }

  remove() {
    // Open the confirmation modal
    this.modal = new (window as any).bootstrap.Modal(document.getElementById('confirmationModal'));
    //modal.toglle();
    //modal.show();
    //modal.hide();
    //modal.dispose();
    this.modal.show();
  }
}
