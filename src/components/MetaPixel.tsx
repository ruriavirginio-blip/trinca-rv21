"use client";

import Script from "next/script";
import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { createMetaEventId } from "@/lib/meta-pixel";

const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

function MetaPixelPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pixelId || typeof window === "undefined" || !window.fbq) {
      return;
    }

    const eventId = createMetaEventId("PageView");

    window.fbq(
      "track",
      "PageView",
      {
        event_id: eventId,
        page_path: pathname,
        page_search: searchParams.toString(),
      },
      { eventID: eventId },
    );
  }, [pathname, searchParams]);

  return null;
}

export default function MetaPixel() {
  if (!pixelId) {
    return null;
  }

  return (
    <>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
          `,
        }}
      />

      <Suspense fallback={null}>
        <MetaPixelPageView />
      </Suspense>

      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          height="1"
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          style={{ display: "none" }}
          width="1"
        />
      </noscript>
    </>
  );
}
