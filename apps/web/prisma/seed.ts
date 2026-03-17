import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const CDN = "https://d289qd9kfgp3a0.cloudfront.net";

async function main() {
  console.log("Seeding database...");

  // --- Product: The Sauce Powered by Tyrone Jones (8 oz) ---
  const product = await prisma.product.upsert({
    where: { slug: "the-original-sauce" },
    update: {},
    create: {
      name: "The Sauce Powered by Tyrone Jones",
      slug: "the-original-sauce",
      tagline: "A sweet-and-tangy everything sauce",
      description:
        "<p>The Sauce Powered by Tyrone Jones is a sweet-and-tangy everything sauce " +
        "made to go wherever great flavor belongs — from BBQ to breakfast and everything " +
        "in between. Drip it, drizzle it, glaze it, or use it as a marinade.</p>" +
        "<p>Bold, versatile flavor crafted without fillers. Perfect on pizza, eggs Benedict, " +
        "stir fry, scallops, ribs, wings, salads, and more. Built on family, authenticity, " +
        "and handcrafted flavor.</p>",
      shortDescription:
        "A sweet-and-tangy everything sauce — drip, drizzle, glaze, or marinate. Bold flavor, no fillers.",
      price: 15.00,
      category: "original",
      isFeatured: true,
      isActive: true,
      stock: 100,
      sortOrder: 1,
      ingredients:
        "Tomato paste, brown sugar, apple cider vinegar, honey, " +
        "molasses, garlic powder, onion powder, smoked paprika, " +
        "black pepper, sea salt, natural spices.",
      features: JSON.stringify([
        "Gluten-free",
        "Vegan",
        "No fillers or artificial preservatives",
        "Small-batch crafted",
        "Family-owned, made in the USA",
        "Versatile — BBQ, breakfast, pizza, stir-fry, salads",
      ]),
      // Nutrition (8 oz bottle)
      servingSize: "2 tbsp (32g)",
      calories: 45,
      totalFat: "0g",
      sodium: "280mg",
      totalCarbs: "11g",
      sugars: "9g",
      protein: "0g",
      // SEO
      metaTitle: "The Sauce Powered by Tyrone Jones | Sweet & Tangy Everything Sauce",
      metaDescription:
        "The Sauce Powered by Tyrone Jones — a sweet-and-tangy everything sauce. Gluten-free, vegan, no fillers. Perfect for BBQ, breakfast, and everything in between.",
      images: {
        create: [
          {
            url: `${CDN}/products/the-original-sauce/bottle-white-bg.png`,
            alt: "The Sauce Powered by Tyrone Jones - bottle on white background",
            isPrimary: true,
            sortOrder: 0,
            width: 844,
            height: 1500,
          },
          {
            url: `${CDN}/products/the-original-sauce/bottle-no-bg.png`,
            alt: "The Sauce Powered by Tyrone Jones - bottle transparent background",
            isPrimary: false,
            sortOrder: 1,
            width: 433,
            height: 577,
          },
          {
            url: `${CDN}/products/the-original-sauce/bottle-with-box.png`,
            alt: "The Sauce Powered by Tyrone Jones - bottle with box packaging",
            isPrimary: false,
            sortOrder: 2,
            width: 500,
            height: 500,
          },
        ],
      },
    },
  });
  console.log(`  Created product: ${product.name} (id=${product.id})`);

  // --- Site Settings ---
  const settings = await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      siteName: "The Sauce Powered by Tyrone Jones",
      siteDescription:
        "Bold, authentic, cultural flavor. A sweet-and-tangy everything sauce made to go wherever great flavor belongs.",
      shippingNote: "Free shipping on orders over $50",
      contactEmail: "admin@jonesingforsauce.com",
      announcementMessage: "Free shipping on orders over $50!",
      announcementActive: true,
      defaultMetaTitle: "The Sauce Powered by Tyrone Jones | Sweet & Tangy Everything Sauce",
      defaultMetaDescription:
        "The Sauce Powered by Tyrone Jones — a sweet-and-tangy everything sauce. Gluten-free, vegan, no fillers. From BBQ to breakfast and everything in between.",
    },
  });
  console.log(`  Created site settings (id=${settings.id})`);

  // --- Gallery Images ---
  await prisma.galleryImage.deleteMany();
  await prisma.galleryImage.createMany({
    data: [
      {
        url: `${CDN}/gallery/salad-drizzled-with-sauce.png`,
        alt: "Fresh salad drizzled with The Sauce",
        sortOrder: 1,
        isActive: true,
      },
      {
        url: `${CDN}/gallery/bbq-ribs-with-sauce.jpg`,
        alt: "Barbecue ribs cooked in The Sauce",
        sortOrder: 2,
        isActive: true,
      },
    ],
  });
  console.log("  Created 2 gallery images");

  // --- Social Links ---
  // Delete existing social links before re-seeding to avoid duplicates
  await prisma.socialLink.deleteMany();
  const socialLinks = await Promise.all([
    prisma.socialLink.create({
      data: {
        platform: "instagram",
        url: "https://www.instagram.com/the_sauce_by_tyrone_jones/",
        sortOrder: 1,
      },
    }),
    prisma.socialLink.create({
      data: {
        platform: "amazon",
        url: "https://www.amazon.com/Sauce-Barbecue-Ingredients-Drizzling-Family-Owned/dp/B0FNKXDH2K",
        sortOrder: 2,
      },
    }),
  ]);
  console.log(`  Created ${socialLinks.length} social links`);

  // --- Admin User ---
  const passwordHash = await bcrypt.hash("changeme123", 12);
  const admin = await prisma.adminUser.upsert({
    where: { email: "admin@jonesingforsauce.com" },
    update: {},
    create: {
      email: "admin@jonesingforsauce.com",
      passwordHash,
      name: "Admin",
    },
  });
  console.log(`  Created admin user: ${admin.email} (id=${admin.id})`);
  console.warn("\n  *** ADMIN USER CREATED WITH DEFAULT PASSWORD — CHANGE IMMEDIATELY AFTER FIRST LOGIN ***\n");

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
