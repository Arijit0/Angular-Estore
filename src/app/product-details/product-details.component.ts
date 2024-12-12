import { Component, OnDestroy, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { HeadComponent } from "../header/head/head.component";
import { CategoryComponent } from "../category/category.component";
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MasterService } from '../services/master.service';
import { Product } from '../product';

@Component({
    selector: 'app-product-details',
    imports: [HeadComponent, CategoryComponent, CommonModule],
    templateUrl: './product-details.component.html',
    styleUrl: './product-details.component.css'
})
export class ProductDetailsComponent  implements OnInit,OnDestroy {

  product: Product | undefined; // Use the Product interface

  arrCartItems: any[] = [];
  isAddedToCart = false;

  productId: any;

  isLoading: boolean = true; // Indicates if the data is loading

  loadingMessages = [
    'Fetching your data...',
    'Almost there...',
    'Preparing your results...',
    'Just a moment, please...',
  ];
  loadingMessage: string = this.loadingMessages[0];
  private loadingMessageInterval: any;

  constructor(
    private titleService: Title,
    private metaService: Meta,
    private toastr: ToastrService,
    private router: Router,
    private route: ActivatedRoute,
    private masterService: MasterService
  ) {}

  ngOnInit(): void {
    this.startLoadingMessageRotation();

    // Simulate a data fetch (replace with your actual data fetch logic)
    setTimeout(() => {
      this.isLoading = false; // Set to false when data is loaded
      this.stopLoadingMessageRotation();
    }, 5000); // Simulate 5 seconds loading
    this.productId = this.route.snapshot.paramMap.get('id');
    this.fetchProductDetails();
  }

  ngOnDestroy(): void {
    this.stopLoadingMessageRotation(); // Clean up interval on component destroy
  }

  private startLoadingMessageRotation(): void {
    let index = 0;

    this.loadingMessageInterval = setInterval(() => {
      index = (index + 1) % this.loadingMessages.length; // Cycle through messages
      this.loadingMessage = this.loadingMessages[index];
    }, 1000); // Change message every second
  }

  private stopLoadingMessageRotation(): void {
    if (this.loadingMessageInterval) {
      clearInterval(this.loadingMessageInterval);
    }
  }

  fetchProductDetails() {
    if (!this.productId) {
      console.warn('Product ID not found in route.');
      this.isLoading = false;
      return;
    }
  
    // Fetch product details
    this.masterService.getProductById(this.productId).subscribe({
      next: async (data: Product | null) => {
        if (data) {
          this.product = data;
  
          // Set SEO meta tags and page title
          this.masterService.setMetaTagsAndTitle(undefined,this.product);
  
          try {

            const user = this.masterService.getUser();
            if (user) {
              // Check if the product is in the wishlist
              const isInWishlist = await this.masterService.isProductInWishlist(user.uid, this.product.productId);
              this.product.isInWishlist = isInWishlist; 
            }

            // Fetch cart items using the service method
            const cartItems = await this.masterService.fetchCartItems();
  
            // Check if the product is in the cart
            if (cartItems.some((item: any) => item.productId === this.productId)) {
              this.isAddedToCart = true;
            } else {
              this.isAddedToCart = false;
            }
          } catch (error) {
            console.error('Error fetching cart items:', error);
            this.isAddedToCart = false; // Default to false in case of error
          } finally {
            this.isLoading = false; // Stop the loader regardless of success or failure
          }
        } else {
          console.warn('Product data not found for the given ID.');
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Error fetching product data:', err);
        this.isLoading = false;
      },
    });
  }
  

  // setMetaTagsAndTitle(product: Product) {
  //   // Set dynamic page title and meta tags for SEO
  //   this.titleService.setTitle(product.itemName);
  //   this.metaService.addTags([
  //     { name: 'description', content: product.itemDescription },
  //     { property: 'og:title', content: product.itemName },
  //     { property: 'og:description', content: product.itemDescription },
  //     { property: 'og:image', content: product.itemImage },
  //     { property: 'og:url', content: window.location.href },
  //     { name: 'twitter:card', content: 'summary_large_image' },
  //     { name: 'twitter:title', content: product.itemName },
  //     { name: 'twitter:description', content: product.itemDescription },
  //     { name: 'twitter:image', content: product.itemImage },
  //     { name: 'twitter:image:alt', content: product.itemDescription}
  //   ]);
  // }
  

  toggleWishlist(product: any) {
    if (this.masterService.getUser()) {
      if (product.isInWishlist) {
        product.isInWishlist = false;
        this.removeProductFromWishList(product); // Remove from wishlist
      } else {
        product.isInWishlist = true;
        this.addProductToWishlist(product); // Add to wishlist
      }
    } else {
      this.toastr.error('Please log in to manage your wishlist');
    }
  }
  
  // Add to wishlist
  addProductToWishlist(product: any) {
    this.masterService.addToWishlist(this.masterService.getUser().uid, product.productId)
      .then(() => {
        this.toastr.success('Added to wishlist');
      })
      .catch(err => {
        console.error('Error adding to wishlist:', err);
        this.toastr.error('Failed to add to wishlist');
  
      });
  }
  
  // Remove from wishlist
  removeProductFromWishList(product: any) {
    this.masterService.removeFromWishlist(this.masterService.getUser().uid,product.productId)    
    .then(() => {
      this.toastr.success('Removed from Wishlist!');
    })
    .catch(err => {
      console.error('Error adding to wishlist:', err);
      this.toastr.error('Could not remove from wishlist.');
  
    });
  } 

  

  toggleCartAction() {
    const user = this.masterService.getUser(); // Check if the user is logged in
    if (user) {
      // Fetch cart items from Firestore for logged-in user
      this.masterService.fetchCartItems().then((storedArray) => {
        this.arrCartItems = storedArray || [];
        
        if (!this.isAddedToCart) {
          // Add the new product to the cart
          this.arrCartItems.push(this.product);
          this.isAddedToCart = true;
        } else {
          // Remove the product if it's already in the cart
          this.arrCartItems = this.arrCartItems.filter(
            (item: any) => item.productId !== this.productId
          );
          this.isAddedToCart = false;
        }
  
        // Save updated cart to Firestore
        this.masterService.saveCartItems(this.arrCartItems);
          this.router.navigate(['/viewcart']);
      });
    } else {
      // Handle cart for guest users (localStorage)
      const storedArray = JSON.parse(localStorage.getItem('cartItems') || '[]');
      this.arrCartItems = storedArray;
  
      if (!this.isAddedToCart) {
        // Add the new product to the cart
        this.arrCartItems.push(this.product);
        this.isAddedToCart = true;
      } else {
        // Remove the product if it's already in the cart
        this.arrCartItems = this.arrCartItems.filter(
          (item: any) => item.productId !== this.productId
        );
        this.isAddedToCart = false;
      }
  
      // Save updated cart to localStorage
      localStorage.setItem('cartItems', JSON.stringify(this.arrCartItems));
      this.router.navigate(['/viewcart']);
    }
  }
  

  goToCart() {
    this.router.navigate(['/viewcart']);
  }

}
