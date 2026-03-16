import { describe, it, expect } from "vitest";
import { escapeHtml, escapeAttr } from "../export-utils";

describe("escapeHtml", () => {
  it("returns empty string for empty input", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("does not modify plain text with no special characters", () => {
    expect(escapeHtml("Hello, World!")).toBe("Hello, World!");
  });

  it("escapes ampersands", () => {
    expect(escapeHtml("Tom & Jerry")).toBe("Tom &amp; Jerry");
  });

  it("escapes less-than signs", () => {
    expect(escapeHtml("1 < 2")).toBe("1 &lt; 2");
  });

  it("escapes greater-than signs", () => {
    expect(escapeHtml("2 > 1")).toBe("2 &gt; 1");
  });

  it("escapes double quotes", () => {
    expect(escapeHtml('say "hello"')).toBe("say &quot;hello&quot;");
  });

  it("escapes single quotes", () => {
    expect(escapeHtml("it's fine")).toBe("it&#039;s fine");
  });

  it("escapes a <script> tag XSS payload", () => {
    const input = "<script>alert('xss')</script>";
    const output = escapeHtml(input);
    expect(output).not.toContain("<script>");
    expect(output).not.toContain("</script>");
    expect(output).toContain("&lt;script&gt;");
  });

  it("escapes an onclick XSS payload", () => {
    const input = '<img src=x onerror="alert(1)">';
    const output = escapeHtml(input);
    expect(output).not.toContain("<img");
    expect(output).toContain("&lt;img");
  });

  it("escapes multiple special characters in one string", () => {
    const input = "<b>Tom & \"Jerry\"</b>";
    const output = escapeHtml(input);
    expect(output).toBe("&lt;b&gt;Tom &amp; &quot;Jerry&quot;&lt;/b&gt;");
  });

  it("handles strings with only special characters", () => {
    expect(escapeHtml("<>&\"'")).toBe("&lt;&gt;&amp;&quot;&#039;");
  });

  it("is idempotent when input contains no special characters", () => {
    const plain = "Hello World 123";
    expect(escapeHtml(plain)).toBe(plain);
  });
});

describe("escapeAttr", () => {
  it("returns empty string for empty input", () => {
    expect(escapeAttr("")).toBe("");
  });

  it("escapes all HTML special characters", () => {
    expect(escapeAttr("<b>")).toBe("&lt;b&gt;");
  });

  it("escapes newlines as &#10;", () => {
    expect(escapeAttr("line1\nline2")).toBe("line1&#10;line2");
  });

  it("escapes both HTML characters and newlines", () => {
    expect(escapeAttr("<tag>\nvalue")).toBe("&lt;tag&gt;&#10;value");
  });

  it("escapes double quotes (critical for attribute injection)", () => {
    const input = '" onmouseover="alert(1)';
    const output = escapeAttr(input);
    expect(output).not.toContain('"');
    expect(output).toContain("&quot;");
  });

  it("escapes a multi-line XSS payload for attribute context", () => {
    const input = "normal\n<script>alert(1)</script>";
    const output = escapeAttr(input);
    expect(output).not.toContain("<script>");
    expect(output).toContain("&#10;");
    expect(output).toContain("&lt;script&gt;");
  });
});
