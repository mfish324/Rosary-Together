# Uploading Sacred Art Images to Firebase Storage

## Step 1: Enable Firebase Storage

1. Go to: https://console.firebase.google.com/project/rosary-together/storage
2. Click **"Get Started"**
3. Choose a location (us-central1 is fine)
4. Click **"Done"**

## Step 2: Deploy Storage Rules

After enabling Storage, run this command:

```bash
npx firebase deploy --only storage
```

## Step 3: Upload Images

In the Firebase Console Storage section, create the following folder structure and upload images:

```
mysteries/
  joyful/
    1.jpg  (The Annunciation)
    2.jpg  (The Visitation)
    3.jpg  (The Nativity)
    4.jpg  (The Presentation)
    5.jpg  (Finding in the Temple)
  sorrowful/
    1.jpg  (Agony in the Garden)
    2.jpg  (The Scourging at the Pillar)
    3.jpg  (Crowning with Thorns)
    4.jpg  (Carrying the Cross)
    5.jpg  (The Crucifixion)
  glorious/
    1.jpg  (The Resurrection)
    2.jpg  (The Ascension)
    3.jpg  (The Descent of the Holy Spirit)
    4.jpg  (The Assumption of Mary)
    5.jpg  (The Coronation of Mary)
  luminous/
    1.jpg  (Baptism of Jesus)
    2.jpg  (Wedding at Cana)
    3.jpg  (Proclamation of the Kingdom)
    4.jpg  (The Transfiguration)
    5.jpg  (Institution of the Eucharist)
prayers/
  crucifix.jpg
  holy-spirit.jpg
  madonna.jpg
  praying-hands.jpg
```

### How to Upload:

1. Click on the folder icon or **"Upload file"** button
2. Create folders: Click the folder icon, type `mysteries`, press Enter
3. Navigate into `mysteries`, create `joyful`, `sorrowful`, `glorious`, `luminous`
4. Navigate into each mystery type folder and upload the corresponding numbered images

## Suggested Image Sources (Public Domain)

- **Wikimedia Commons**: https://commons.wikimedia.org (search "Rosary mysteries art")
- **The Metropolitan Museum of Art**: https://www.metmuseum.org/art/collection (filter by Open Access)
- **National Gallery of Art**: https://www.nga.gov/open-access-images.html

Look for works by:
- Fra Angelico
- Botticelli
- Raphael
- El Greco
- Murillo
- Caravaggio

## Image Recommendations

- Resolution: 800x600 pixels minimum (will be displayed at various sizes)
- Format: JPEG (.jpg)
- Aspect ratio: Landscape (wider than tall) works best

## Testing

After uploading, refresh the app. Images will load from Firebase Storage. If an image isn't found, the app will show a colored placeholder with the mystery name.
