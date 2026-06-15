import CockpitClient from "./CockpitClient";

export default function CockpitPage() {
  return <CockpitClient cockpitPassword={process.env.COCKPIT_PASSWORD || "rv21"} />;
}
