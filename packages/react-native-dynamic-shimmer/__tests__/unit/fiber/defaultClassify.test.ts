import { describe, expect, it } from "vitest";
import { defaultClassify } from "../../../src/fiber/defaultClassify";
import { Image, Text, View } from "../../helpers/fakeFiber";

describe("defaultClassify", () => {
  it("classifies text as leaf", () => {
    expect(defaultClassify(Text("hi"))).toBe("leaf");
  });

  it("classifies image as leaf", () => {
    expect(defaultClassify(Image())).toBe("leaf");
  });

  it("classifies text input as leaf", () => {
    expect(
      defaultClassify({
        type: "RCTTextInput",
        memoizedProps: {},
        stateNode: {},
        child: null,
        sibling: null,
        return: null,
      }),
    ).toBe("leaf");
  });

  it("classifies hidden (display: none) as skip", () => {
    expect(defaultClassify(View({ style: { display: "none" } }))).toBe("skip");
  });

  it("classifies hidden (opacity: 0) as skip", () => {
    expect(defaultClassify(View({ style: { opacity: 0 } }))).toBe("skip");
  });

  it("classifies a childless host with a background as leaf", () => {
    expect(defaultClassify(View({ style: { backgroundColor: "#000" } }))).toBe("leaf");
  });

  it("classifies a View with children AND backgroundColor as container", () => {
    expect(defaultClassify(View({ style: { backgroundColor: "#000" } }, Text("inside")))).toBe(
      "container",
    );
  });

  it("classifies a View with children AND borderRadius as container", () => {
    expect(defaultClassify(View({ style: { borderRadius: 8 } }, Text("hi")))).toBe("container");
  });

  it("classifies a View with children AND borderWidth as container", () => {
    expect(defaultClassify(View({ style: { borderWidth: 1 } }, Text("hi")))).toBe("container");
  });

  it("classifies a View with children AND shadowOpacity as container", () => {
    expect(defaultClassify(View({ style: { shadowOpacity: 0.3 } }, Text("hi")))).toBe("container");
  });

  it("classifies a plain wrapper with children as transparent", () => {
    expect(defaultClassify(View({}, Text("hi")))).toBe("transparent");
  });

  it("classifies a function-component fiber as transparent even if its name matches a content type", () => {
    // <Text> is a forwardRef whose displayName is "Text" but whose fiber.type
    // is a function, not a string. The real host fiber (type: "RCTText") is
    // one level below. The walker must descend — not stop at the component
    // fiber with a null stateNode.
    const componentText = {
      type: function Text() {
        return null;
      },
      memoizedProps: {},
      stateNode: null,
      child: null,
      sibling: null,
      return: null,
    };
    expect(defaultClassify(componentText)).toBe("transparent");
  });

  it("classifies a function-component named View as transparent", () => {
    const componentView = {
      type: function View() {
        return null;
      },
      memoizedProps: { style: { backgroundColor: "#fff" } },
      stateNode: null,
      child: null,
      sibling: null,
      return: null,
    };
    // Even though it has a bg color, it's not a host — no stateNode to measure.
    expect(defaultClassify(componentView)).toBe("transparent");
  });
});
