export default function HomepageDash() {
  return (
    <div style={{ margin: "-24px", height: "calc(100vh - 0px)" }}>
      <iframe
        src="/homepage-app/"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          display: "block",
        }}
        title="Homepage Dashboard"
      />
    </div>
  );
}
