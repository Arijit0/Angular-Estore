import { Component, Input, OnChanges } from '@angular/core';
import { MasterService } from '../services/master.service';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser';

@Component({
    selector: 'app-product-lists',
    imports: [NgxSkeletonLoaderModule, CommonModule],
    templateUrl: './product-lists.component.html',
    styleUrl: './product-lists.component.css'
})
export class ProductListsComponent implements OnChanges {

  @Input() getCategoryNameFromURL: any;
  @Input() query: any;

  allProducts: any[] = [];
  isLoading = true;
  widthSizeInPixels = 300;
  HeightSizeInPixels = 300;
  isQueryMatched: boolean = false;

  constructor(private http: MasterService,
    private toastr: ToastrService, 
    private router: Router,
    private titleService: Title
  ) {}

  ngOnChanges(): void {
    // Set page title
    this.titleService.setTitle('Angular-Estore');
    this.allProductLists();
  }



  allProductLists() {
    this.isLoading = true;
  
    if (this.getCategoryNameFromURL) {
      // Fetch products by category
      this.http.getProductsByCategory(this.getCategoryNameFromURL).subscribe((res: any) => {
        this.allProducts = res; // Store fetched products
  
        if (this.http.getUser()) {
          const userId = this.http.getUser().uid; // Get the current user ID
  
          // Create an array of promises for wishlist checks
          const wishlistPromises = this.allProducts.map((element) => {
            // Initially set `isInWishlist` to false
            element.isInWishlist = false;
  
            // Check if the product is in the user's wishlist
            return this.http.isProductInWishlist(userId, element.productId)
              .then((isInWishlist: boolean) => {
                // If the product is in the wishlist, set `isInWishlist` to true
                element.isInWishlist = isInWishlist;
              })
              .catch((error) => {
                console.error('Error checking wishlist status:', error);
              });
          });
  
          // Wait for all wishlist checks to complete
          Promise.all(wishlistPromises).then(() => {
            // Once all wishlist checks are done, set isLoading to false
            this.isLoading = false;
          });
        } else {
          // If user is not logged in, no wishlist checks are needed
          this.isLoading = false;
        }
  
        console.log(this.allProducts); // Log the updated product list
      });
    } else {
      // Fetch all products if no category
      this.http.getAllProducts().subscribe({
        next: (data: any) => {
          this.allProducts = data; // Store fetched products
          console.log( this.allProducts);
          if (this.http.getUser()) {
            const userId = this.http.getUser().uid; // Get the current user ID
  
            // Create an array of promises for wishlist checks
            const wishlistPromises = this.allProducts.map((element) => {
              // Initially set `isInWishlist` to false
              element.isInWishlist = false;
  
              // Check if the product is in the user's wishlist
              return this.http.isProductInWishlist(userId, element.productId)
                .then((isInWishlist: boolean) => {
                  // If the product is in the wishlist, set `isInWishlist` to true
                  element.isInWishlist = isInWishlist;
                })
                .catch((error) => {
                  console.error('Error checking wishlist status:', error);
                });
            });
  
            // Wait for all wishlist checks to complete
            Promise.all(wishlistPromises).then(() => {
              // Once all wishlist checks are done, set isLoading to false
              this.isLoading = false;
            });
          } else {
            // If user is not logged in, no wishlist checks are needed
            this.isLoading = false;
          }
  
          if (this.query) {
            this.search();
          }
        },
        error: (error) => {
          console.error('Error fetching products:', error);
          this.isLoading = false;
        }
      });
    }
  }  

  
  search() {
    this.isLoading = true;
    this.allProducts = this.allProducts.filter(item => 
      item.itemName.toLowerCase().includes(this.query.toLowerCase()) 
      || item.itemCategory.toLowerCase().includes(this.query.toLowerCase())
    );
    this.isLoading = false;
  }

  goToDetails(item: any) {
    this.router.navigate(['/products', item.productId, item.itemName]);
    const newItem = { ...item, quantity: 1 };
    // this.http.sendProductDetailsToLocalStorage(newItem);
    console.log(newItem);
  }

// Add to wishlist
// addProductToWishlist(product: any, event: MouseEvent) {
//   event.stopPropagation();

//   this.http.isProductInWishlist(this.http.getUser().uid,product.productId)
//   .then((data: any) => {
//     console.log(data);
//   })
//   .catch((error: any) => {
//     console.log(error);
//   });

//   // if (this.http.getUser()) {
//   //     this.http.addToWishlist(this.http.getUser().uid,product.productId)
//   //     console.log(product);
//   // } else {
//   //   this.toastr.error('Please log in to add products to your wishlist');
//   // }
// }

toggleWishlist(product: any, event: MouseEvent) {
  event.stopPropagation(); // Prevent parent click event
  if (this.http.getUser()) {
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
  this.http.addToWishlist(this.http.getUser().uid, product.productId)
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
  this.http.removeFromWishlist(this.http.getUser().uid,product.productId)    
  .then(() => {
    this.toastr.success('Removed from Wishlist!');
  })
  .catch(err => {
    console.error('Error adding to wishlist:', err);
    this.toastr.error('Could not remove from wishlist.');

  });
} 


// fetchSpecificUserWishlist() {
//   if (this.http.getUser()) {
//     this.http.getUserWishlist(this.http.getUser().uid).subscribe({
//       next(value) {
        
//       },error(err) {
        
//       },
//     })
//   }
// }

}
