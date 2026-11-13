// html2pdf — renders a local HTML file to a paginated PDF with the macOS WebKit engine.
//
//   html2pdf <input.html> <output.pdf> [a4|letter]
//
// WebKit's own print pipeline does the pagination, so text stays selectable, links stay
// clickable and emoji / symbols fall back to system fonts exactly like they do in Safari.
//
// Compiled on demand by the extension (see src/lib/pdf.ts):
//   swiftc -O -swift-version 5 -parse-as-library -o html2pdf html2pdf.swift
import Cocoa
import WebKit

func die(_ message: String, code: Int32 = 1) -> Never {
    FileHandle.standardError.write(Data("html2pdf: \(message)\n".utf8))
    exit(code)
}

@MainActor
final class Renderer: NSObject, WKNavigationDelegate {
    private let input: URL
    private let output: URL
    private let paperSize: NSSize
    private let margin: CGFloat
    private let webView: WKWebView
    private let window: NSWindow

    init(input: URL, output: URL, paperSize: NSSize, margin: CGFloat) {
        self.input = input
        self.output = output
        self.paperSize = paperSize
        self.margin = margin

        let configuration = WKWebViewConfiguration()
        // Clipboard Markdown can carry raw HTML; the page never needs to run scripts.
        configuration.defaultWebpagePreferences.allowsContentJavaScript = false

        let frame = NSRect(origin: .zero, size: paperSize)
        webView = WKWebView(frame: frame, configuration: configuration)
        // A WebKit print operation has to belong to a window to paginate.
        window = NSWindow(contentRect: frame, styleMask: [.borderless], backing: .buffered, defer: false)
        window.contentView = webView

        super.init()
        webView.navigationDelegate = self
    }

    func start() {
        webView.loadFileURL(input, allowingReadAccessTo: input.deletingLastPathComponent())
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        // Give images and layout a moment to settle before printing.
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            MainActor.assumeIsolated { self.printToPDF() }
        }
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        die("load failed: \(error.localizedDescription)")
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        die("load failed: \(error.localizedDescription)")
    }

    private func printToPDF() {
        let info = NSPrintInfo(dictionary: [
            .jobDisposition: NSPrintInfo.JobDisposition.save,
            .jobSavingURL: output,
        ])
        info.paperSize = paperSize
        info.topMargin = margin
        info.bottomMargin = margin
        info.leftMargin = margin
        info.rightMargin = margin
        info.isHorizontallyCentered = false
        info.isVerticallyCentered = false
        info.horizontalPagination = .fit
        info.verticalPagination = .automatic

        let operation = webView.printOperation(with: info)
        operation.showsPrintPanel = false
        operation.showsProgressPanel = false
        // WebKit lays the page out against this frame; if it is not the paper size the pages come out blank.
        operation.view?.frame = NSRect(origin: .zero, size: paperSize)
        operation.runModal(
            for: window,
            delegate: self,
            didRun: #selector(printOperationDidRun(_:success:contextInfo:)),
            contextInfo: nil
        )
    }

    @objc private func printOperationDidRun(_ operation: NSPrintOperation, success: Bool, contextInfo: UnsafeMutableRawPointer?) {
        if success { exit(0) }
        die("printing failed")
    }
}

@main
struct HTMLToPDF {
    @MainActor
    static func main() {
        let arguments = CommandLine.arguments
        guard arguments.count >= 3 else { die("usage: html2pdf <input.html> <output.pdf> [a4|letter]", code: 64) }

        // Sizes in PostScript points (1/72 in).
        let paper = arguments.count > 3 ? arguments[3].lowercased() : "a4"
        let paperSize = paper == "letter" ? NSSize(width: 612, height: 792) : NSSize(width: 595.28, height: 841.89)

        let app = NSApplication.shared
        app.setActivationPolicy(.prohibited)

        let renderer = Renderer(
            input: URL(fileURLWithPath: arguments[1]),
            output: URL(fileURLWithPath: arguments[2]),
            paperSize: paperSize,
            margin: 56.7  // 2 cm
        )
        renderer.start()

        DispatchQueue.main.asyncAfter(deadline: .now() + 90) { die("timed out waiting for WebKit") }
        app.run()
    }
}
