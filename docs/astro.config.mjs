import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  site: "https://tychota.github.io",
  base: "/react-native-dynamic-shimmer",
  integrations: [
    starlight({
      title: "react-native-dynamic-shimmer",
      description:
        "Dynamic shimmer skeletons for React Native — the real component is the skeleton.",
      logo: { src: "./public/favicon.svg", alt: "logo" },
      social: { github: "https://github.com/tychota/react-native-dynamic-shimmer" },
      editLink: {
        baseUrl: "https://github.com/tychota/react-native-dynamic-shimmer/edit/main/docs/",
      },
      customCss: ["./src/styles/custom.css"],
      sidebar: [
        { label: "Getting started", link: "/getting-started/" },
        { label: "Usage", link: "/usage/" },
        { label: "API reference", link: "/api/" },
        {
          label: "Theory",
          items: [
            { label: "Yoga layout", link: "/theory/yoga/" },
            { label: "Fabric & JSI", link: "/theory/fabric-jsi/" },
            { label: "Measurement flow", link: "/theory/measurement/" },
            { label: "Accessibility", link: "/theory/accessibility/" },
            { label: "React Compiler", link: "/theory/react-compiler/" },
          ],
        },
        {
          label: "Extension",
          items: [
            { label: "Colors", link: "/extension/colors/" },
            { label: "Animation", link: "/extension/animation/" },
            { label: "renderBone", link: "/extension/render-bone/" },
            { label: "classify", link: "/extension/classify/" },
            { label: "refineBones", link: "/extension/refine-bones/" },
          ],
        },
        {
          label: "Recipes",
          items: [
            { label: "List rows", link: "/recipes/list-rows/" },
            { label: "Pull-to-refresh", link: "/recipes/pull-to-refresh/" },
            { label: "Dark mode with Unistyles", link: "/recipes/dark-mode-unistyles/" },
            { label: "Custom bone (BlurView)", link: "/recipes/custom-bone-blur/" },
          ],
        },
        { label: "Troubleshooting", link: "/troubleshooting/" },
        { label: "Credits", link: "/credits/" },
      ],
    }),
  ],
});
