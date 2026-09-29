# 📦 Firebase Storage Security Rules — সমাধান ও গাইড

## এই মেইলটি কেন এসেছিল?
Firebase Storage শুরুতে **Test Mode**-এ ছিল। টেস্ট মোডের ৩০ দিনের মেয়াদ শেষ হয়ে যাওয়ায় স্টোরেজ স্বয়ংক্রিয়ভাবে ব্লক হয়ে গিয়েছিল।

---

## সমাধান: ২ মিনিটের ধাপ

### ধাপ ১: Firebase Console-এ যান
সরাসরি এই লিংকে যান:
👉 **[Firebase Storage Rules Console](https://console.firebase.google.com/project/ghoroa-3cb2e/storage/ghoroa-3cb2e.firebasestorage.app/rules)**

---

### ধাপ ২: Rules এডিটরে এই কোডটি দিন
পুরো কোড সিলেক্ট করে ডিলিট করে নিচের কোডটি পেস্ট করুন (শেষের দুটি `}` ব্র্যাকেট অবশ্যই নিশ্চিত করুন):

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {

    // Allow public read for all product images
    match /products/{fileName} {
      allow read: if true;
      allow write: if request.auth != null
                   && request.resource.size < 10 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }

    // Default fallback rule
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

---

### ধাপ ৩: "Publish" বাটনে ক্লিক করুন
এডিটরের নিচে বা উপরে ভেসে ওঠা **"Publish"** বাটনে ক্লিক করুন।
