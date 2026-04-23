export default function HomepageDash() {
  return (
    <div style={{ margin: "-24px", height: "calc(100vh - 0px)" }}>
      <iframe
        src="https://home.saudideck.online/"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          display: "block",
        }}
        title="Homepage Dashboard"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
