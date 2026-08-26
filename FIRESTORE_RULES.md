# 🔒 Firestore Security Rules — ডেপ্লয় গাইড

## কেন দরকার?
Firestore টেস্ট মোডের Rules ৩০ দিন পর expire হয়। প্রোডাকশনে যেতে হলে সঠিক Security Rules সেট করতে হবে।

## ডেপ্লয় করার ধাপ

### ধাপ ১: Firebase Console-এ যান
👉 https://console.firebase.google.com/project/ghoroa-3cb2e/firestore/rules

### ধাপ ২: Rules আপডেট করুন
`firestore.rules` ফাইলের পুরো কন্টেন্ট কপি করুন এবং Firebase Console-এর Rules ট্যাবে পেস্ট করুন।

### ধাপ ৩: Publish করুন
"Publish" বাটনে ক্লিক করুন।

## Rules সারাংশ

| Collection | Read | Create | Update/Delete |
|---|---|---|---|
| `products` | সবাই ✅ | লগইন ব্যবহারকারী | মালিক বা অ্যাডমিন |
| `products/{id}/reviews` | সবাই ✅ | সবাই ✅ | অ্যাডমিন |
| `sellers` | সবাই ✅ | নিজের প্রোফাইল | মালিক বা অ্যাডমিন |
| `haats` | সবাই ✅ | লগইন ব্যবহারকারী | মালিক বা অ্যাডমিন |
| `orders` | বিক্রেতা ও অ্যাডমিন | ক্রেতা (সবাই) ✅ | বিক্রেতা বা অ্যাডমিন |
| `seller_leads` | অ্যাডমিন | যেকোনো আবেদনকারী ✅ | অ্যাডমিন |

**অ্যাডমিন**: dr.johir@gmail.com

