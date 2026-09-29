# 📝 ঘরোয়া (Ghoroa) — সেশন ও কনভারসেশন সামারি (Session Summary)

**তারিখ:** ২৯ সেপ্টেম্বর, ২০২৬  
**ডোমেন:** [https://ghoroa.shop](https://ghoroa.shop)  
**রেপোজিটর:** `appJIN/ghoroa` (Branch: `main`)

---

## ১. ফায়ারবেস ক্লাউড স্টোরেজ এক্সপায়ারি ফিক্স (Firebase Storage Rules Fix)

### সমস্যা:
* গুগল ফায়ারবেস থেকে মেইল এসেছিল: `[Firebase] Client access to your Cloud Storage for Firebase bucket expired 29 day(s) ago`.
* টেস্ট মোডের ৩০ দিনের মেয়াদ শেষ হয়ে যাওয়ায় স্টোরেজ ব্লক হয়ে গিয়েছিল এবং সেলাররা নতুন পণ্যের ছবি আপলোড করতে পারছিলেন না (`permission-denied` এরর)।

### সমাধান:
* লোকাল প্রজেক্টে [storage.rules](file:///h:/ghoroa/storage.rules) এবং গাইড [STORAGE_RULES.md](file:///h:/ghoroa/STORAGE_RULES.md) তৈরি করা হয়েছে।
* ফায়ারবেস কনসোলে পার্মানেন্ট ও সুরক্ষিত রুলস কনফিগার ও পাবলিশ করা হয়েছে:
  ```javascript
  rules_version = '2';
  service firebase.storage {
    match /b/{bucket}/o {
      // ক্রেতারা ওয়েবসাইট থেকে পণ্য ও ছবি দেখতে পারবে
      match /products/{fileName} {
        allow read: if true;
        allow write: if request.auth != null
                     && request.resource.size < 10 * 1024 * 1024
                     && request.resource.contentType.matches('image/.*');
      }
      match /{allPaths=**} {
        allow read: if true;
        allow write: if request.auth != null;
      }
    }
  }
  ```
* এর ফলে গ্রাহকরা আনলিমিটেড সময় ছবি দেখতে পারবেন এবং শুধুমাত্র লগইন করা সেলার বা অ্যাডমিন ১০ MB-এর নিচের ছবি আপলোড করতে পারবেন।

---

## ২. সেলার প্যানেল ও আপলোড অডিট (Seller Panel & Upload Hardening)

* **ফাইলনেম স্যানিটাইজেশন:** মোবাইলে তোলার পর ছবির নামে সাধারণত স্পেস, বাংলা বা বিশেষ অক্ষর (যেমন `ছবি (১).jpg`) থাকে। `js/seller.js`-এ ফাইলনেম ক্লিন করার কোড যোগ করা হয়েছে (`name.replace(/[^a-zA-Z0-9.]/g, '_')`), যাতে স্টোরেজে সেভ হওয়ার সময় কোনো লিংক ভেঙে না যায়।
* **ডাবল-ক্লিক প্রিভেনশন ও লোডিং ফিডব্যাক:** সেলার ছবি আপলোড করে সেভ করার সময় বাটন স্বয়ংক্রিয়ভাবে ডিজেবল হয়ে **"⏳ আপলোড ও সেভ হচ্ছে..."** দেখাবে। আপলোড বা সেভ শেষ হলে আবার স্বাভাবিক অবস্থায় ফিরবে। এর ফলে একাধিকবার ক্লিক করে ডুপ্লিকেট প্রোডাক্ট তৈরির ঝুঁকি দূর হয়েছে।

---

## ৩. এসইও অপ্টিমাইজেশন (SEO Enhancements)

1. **গুগল স্ট্যান্ডার্ড সাইটম্যাপ ([sitemap.xml](file:///h:/ghoroa/sitemap.xml)):**
   * গুগল সার্চ কনসোলে এরর সৃষ্টিকারী হ্যাশ ফ্র্যাগমেন্ট (`#products`, `#haat` ইত্যাদি) বাদ দিয়ে ভ্যালিড ক্যানোনিকাল পেজ (`/`, `/shop.html`, `/seller.html`) দিয়ে সাইটম্যাপ আপডেট করা হয়েছে।
2. **ডায়নামিক সোশ্যাল প্রিভিউ ([shop.html](file:///h:/ghoroa/shop.html)):**
   * কোনো সেলারের শপ লিংক (`shop.html#SELLER_UID`) ফেসবুকে বা হোয়াটসঅ্যাপে শেয়ার করলে স্বয়ংক্রিয়ভাবে সেই সেলারের নাম, লোগো এবং স্টোরি কার্ড আকারে প্রদর্শিত হবে।
   * `og:title`, `og:description`, `og:image`, `twitter:card` যুক্ত করা হয়েছে।
3. **Schema.org Structured Data:**
   * গুগল সার্চে র‍্যাংকিং বাড়াতে `Store`, `WebSite`, `BreadcrumbList`, এবং `ItemList` ক্যাটাগরিভিত্তিক স্কিমা যুক্ত করা হয়েছে।
4. **সেলার পেজ মেটা ([seller.html](file:///h:/ghoroa/seller.html)):**
   * ফেভিকন, ক্যানোনিকাল লিংক এবং থিম কালার যোগ করা হয়েছে।

---

## ৪. ন্যাভবার মেন্যু দুই লাইনে ভেঙে যাওয়ার সমস্যার স্থায়ী সমাধান (Navbar Fix)

### সমস্যা:
* ল্যাপটপ এবং মাঝারি স্ক্রিনগুলোতে (<= ১৩৬৬px) মেন্যুর বোতামে লেখা ভেঙে দুই লাইনে চলে যাচ্ছিল (যেমন "দোকান" উপরে এবং "খুলুন" নিচে)।

### সমাধান:
1. `css/style.css`-এ প্রতিটি ন্যাভবার লিঙ্ক ও বাটনে `white-space: nowrap !important;` এবং `flex-wrap: nowrap !important;` প্রয়োগ করা হয়েছে।
2. প্যাডিং ও গ্যাপ নিখুঁত ও স্লিম করা হয়েছে।
3. রেসপনসিভ ব্রেকপয়েন্ট `@media (max-width: 1250px)` করা হয়েছে—যাতে স্ক্রিনের প্রস্থ ১২৫০ পিক্সেলের নিচে নামলেই কোনো বাটন না ভেঙে স্বয়ংক্রিয়ভাবে স্লিম মোবাইল হ্যামবার্গার মেন্যুতে রূপ নেয়।

---

## ৫. ডামি প্রোডাক্ট চিরতরে অপসারণ (Dummy Data Removal)

### সমস্যা:
* পূর্বের একটি গিট মার্জের কারণে `js/app.js`-এর শুরুতে ৮টি হার্ডকোডেড ডামি প্রোডাক্ট ও ৩টি ডামি হাটের অ্যারে আবার যুক্ত হয়ে গিয়েছিল।

### সমাধান:
* `js/app.js` থেকে সব হার্ডকোডেড ডামি ডাটা সম্পূর্ণ মুছে ফেলা হয়েছে (`let PRODUCTS = []; let HAATS = [];`)।
* এখন সরাসরি ফায়ারবেস ফায়ারস্টোর থেকে আসল ডাটা ছাড়া কোনো ডামি এন্ট্রি লোড হবে না (`PRODUCTS = firebaseProducts; HAATS = firebaseHaats;`)।
* **ক্যাশ বাস্টার (Cache Buster):** ব্রাউজার যাতে পুরনো ক্যাশ লোড না করে, সেজন্য `index.html` ও `shop.html`-এ `style.css?v=20260929_2` এবং `app.js?v=20260929_2` যুক্ত করা হয়েছে।

---

## ৬. গিট কমিট হিস্ট্রি (Git Commit History)

| Commit Hash | Message | Description |
|---|---|---|
| `0b74dae` | `Update storage rules and enhance seller product upload UX and security` | স্টোরেজ রুলস ও সেলার আপলোড সিকিউরিটি |
| `9a357b8` | `Optimize SEO: valid XML sitemap, enriched Schema.org structured data, and dynamic Open Graph tags` | এসইও, সাইটম্যাপ ও মেটা ট্যাগ |
| `3503bb2` | `Fix navbar layout: prevent multi-line wrap and remove all hardcoded dummy data` | ন্যাভবার ফিক্স ও ডামি ডাটা ক্লিন |
| `3f2e443` | `Bust cache with v=20260929_2, enforce strict single-line navbar and 1250px mobile breakpoint` | ক্যাশ বাস্টার ও ১২৫০px ব্রেকপয়েন্ট |

সব কমিট GitHub `origin/main`-এ পুশ করা হয়েছে এবং লাইভ সার্ভার [https://ghoroa.shop](https://ghoroa.shop)-এ কার্যকর রয়েছে।
