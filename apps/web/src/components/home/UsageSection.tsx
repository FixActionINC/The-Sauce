import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion";

const USE_CASES = [
  { icon: "🔥", label: "BBQ", desc: "Ribs, brisket, pulled pork" },
  { icon: "🍗", label: "Wings", desc: "Toss or drizzle" },
  { icon: "🍕", label: "Pizza", desc: "The perfect finish" },
  { icon: "🍳", label: "Breakfast", desc: "Eggs, bacon, biscuits" },
  { icon: "🍔", label: "Burgers", desc: "Sweet heat on every bite" },
  { icon: "🥗", label: "Salads", desc: "Bold dressings & drizzles" },
];

export function UsageSection() {
  return (
    <section className="w-full bg-gradient-to-br from-brand-orange to-brand-red py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <h2 className="text-center font-heading text-3xl font-black uppercase tracking-wider text-white md:text-4xl lg:text-5xl">
            Put It On Everything
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-lg text-white/80">
            From the grill to the table — The Sauce makes everything better.
          </p>
        </FadeIn>

        <StaggerContainer className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6">
          {USE_CASES.map((item) => (
            <StaggerItem key={item.label}>
              <div className="flex flex-col items-center rounded-lg bg-white/10 p-6 text-center backdrop-blur-sm transition-colors hover:bg-white/20">
                <span className="text-4xl md:text-5xl">{item.icon}</span>
                <h3 className="mt-3 font-heading text-lg font-bold uppercase tracking-wide text-white">
                  {item.label}
                </h3>
                <p className="mt-1 text-sm text-white/70">{item.desc}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
