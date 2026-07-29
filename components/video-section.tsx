export function VideoSection() {
  return (
    <section id="video" className="border-t border-border px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-sm font-semibold tracking-[0.2em] text-primary">宣傳影片</h2>

        <div className="relative mt-10 aspect-video overflow-hidden rounded-lg bg-card">
          <iframe
            src="https://www.youtube-nocookie.com/embed/BGMdgLzO748"
            title="PASSION 26 宣傳影片"
            className="absolute inset-0 size-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            loading="lazy"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  )
}
