import { TestimonialsManager } from "@/components/admin/TestimonialsManager";
import { getTestimonials } from "@/lib/services/testimonial.service";

export default async function AdminTestimonialsPage() {
  const testimonials = await getTestimonials();

  return (
    <div>
      <h1 className="text-2xl font-bold">Testimonials</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Manage customer testimonials displayed on the homepage.
      </p>

      <div className="mt-6">
        <TestimonialsManager testimonials={testimonials} />
      </div>
    </div>
  );
}
