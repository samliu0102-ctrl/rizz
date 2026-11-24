import Foundation
import ImageIO
import Vision

// On-device text recognition for chat screenshots, used to build voice
// profiles. Returns one JSON object per recognized line with its normalized
// bounding box (origin bottom-left), so Rust can tell left bubbles from right.

private func duplicateOcrCString(_ text: String) -> UnsafeMutablePointer<CChar>? {
    return text.withCString { strdup($0) }
}

@_cdecl("recognize_text_lines_apple")
public func recognizeTextLines(
    _ imagePath: UnsafePointer<CChar>
) -> UnsafeMutablePointer<AppleLLMResponse> {
    let path = String(cString: imagePath)
    let responsePtr = UnsafeMutablePointer<AppleLLMResponse>.allocate(capacity: 1)
    responsePtr.initialize(to: AppleLLMResponse(response: nil, success: 0, error_message: nil))

    let url = URL(fileURLWithPath: path)
    guard let source = CGImageSourceCreateWithURL(url as CFURL, nil),
        let image = CGImageSourceCreateImageAtIndex(source, 0, nil)
    else {
        responsePtr.pointee.error_message = duplicateOcrCString("Could not open image.")
        return responsePtr
    }

    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = true
    if #available(macOS 13.0, *) {
        request.automaticallyDetectsLanguage = true
    }

    let handler = VNImageRequestHandler(cgImage: image, options: [:])
    do {
        try handler.perform([request])
    } catch {
        responsePtr.pointee.error_message = duplicateOcrCString(error.localizedDescription)
        return responsePtr
    }

    var lines: [[String: Any]] = []
    for observation in request.results ?? [] {
        guard let candidate = observation.topCandidates(1).first else { continue }
        let box = observation.boundingBox
        lines.append([
            "text": candidate.string,
            "min_x": Double(box.minX),
            "max_x": Double(box.maxX),
            "min_y": Double(box.minY),
            "max_y": Double(box.maxY),
        ])
    }

    guard let data = try? JSONSerialization.data(withJSONObject: lines),
        let json = String(data: data, encoding: .utf8)
    else {
        responsePtr.pointee.error_message = duplicateOcrCString("Could not encode text.")
        return responsePtr
    }

    responsePtr.pointee.response = duplicateOcrCString(json)
    responsePtr.pointee.success = 1
    return responsePtr
}
