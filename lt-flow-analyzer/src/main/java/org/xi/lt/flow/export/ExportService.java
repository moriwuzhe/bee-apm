package org.xi.lt.flow.export;

import lombok.extern.slf4j.Slf4j;
import net.sourceforge.plantuml.FileFormat;
import net.sourceforge.plantuml.FileFormatOption;
import net.sourceforge.plantuml.SourceStringReader;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.xi.lt.flow.generator.PlantUmlCallChainGenerator;
import org.xi.lt.flow.model.FlowGraph;
import org.xi.lt.flow.service.PlantUmlService;
import org.xi.lt.flow.theme.ChartTheme;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * 导出服务 - 支持将流程图导出为多种格式
 */
@Slf4j
@Service
public class ExportService {

    @Autowired
    private PlantUmlService plantUmlService;

    private final PlantUmlCallChainGenerator generator = new PlantUmlCallChainGenerator();

    /**
     * 导出格式枚举
     */
    public enum ExportFormat {
        PNG("png", "image/png"),
        SVG("svg", "image/svg+xml"),
        PDF("pdf", "application/pdf"),
        EPS("eps", "application/postscript"),
        TEXT("puml", "text/plain"),
        HTML("html", "text/html");

        private final String extension;
        private final String mimeType;

        ExportFormat(String extension, String mimeType) {
            this.extension = extension;
            this.mimeType = mimeType;
        }

        public String getExtension() {
            return extension;
        }

        public String getMimeType() {
            return mimeType;
        }
    }

    /**
     * 导出流程图为指定格式
     */
    public Map<String, Object> exportFlowGraph(FlowGraph graph,
                                                 PlantUmlCallChainGenerator.DiagramStyle style,
                                                 ChartTheme theme,
                                                 ExportFormat format,
                                                 String outputPath) {
        Map<String, Object> result = new HashMap<>();

        try {
            String plantUmlContent = generator.generatePlantUml(graph, style, theme);

            byte[] content;
            if (format == ExportFormat.TEXT) {
                content = plantUmlContent.getBytes("UTF-8");
            } else {
                content = renderToFormat(plantUmlContent, format);
            }

            if (outputPath != null && !outputPath.isEmpty()) {
                File outputFile = new File(outputPath);
                try (FileOutputStream fos = new FileOutputStream(outputFile)) {
                    fos.write(content);
                }
                result.put("outputPath", outputFile.getAbsolutePath());
            }

            result.put("success", true);
            result.put("content", content);
            result.put("mimeType", format.getMimeType());
            result.put("extension", format.getExtension());
            result.put("plantUmlContent", plantUmlContent);

            log.info("导出成功！格式: {}, 大小: {} bytes", format, content.length);

        } catch (Exception e) {
            log.error("导出失败", e);
            result.put("success", false);
            result.put("message", "导出失败: " + e.getMessage());
        }

        return result;
    }

    /**
     * 将 PlantUML 内容渲染为指定格式
     */
    public byte[] renderToFormat(String plantUmlContent, ExportFormat format) throws IOException {
        SourceStringReader reader = new SourceStringReader(plantUmlContent);
        ByteArrayOutputStream os = new ByteArrayOutputStream();

        FileFormat fileFormat;
        switch (format) {
            case PNG:
                fileFormat = FileFormat.PNG;
                break;
            case SVG:
                fileFormat = FileFormat.SVG;
                break;
            case PDF:
                fileFormat = FileFormat.PDF;
                break;
            case EPS:
                fileFormat = FileFormat.EPS;
                break;
            case HTML:
                fileFormat = FileFormat.HTML;
                break;
            default:
                throw new IllegalArgumentException("不支持的格式: " + format);
        }

        reader.outputImage(os, new FileFormatOption(fileFormat));
        return os.toByteArray();
    }

    /**
     * 快速导出为 PNG
     */
    public byte[] exportToPng(FlowGraph graph,
                               PlantUmlCallChainGenerator.DiagramStyle style,
                               ChartTheme theme) throws IOException {
        String plantUmlContent = generator.generatePlantUml(graph, style, theme);
        return renderToFormat(plantUmlContent, ExportFormat.PNG);
    }

    /**
     * 快速导出为 SVG
     */
    public byte[] exportToSvg(FlowGraph graph,
                               PlantUmlCallChainGenerator.DiagramStyle style,
                               ChartTheme theme) throws IOException {
        String plantUmlContent = generator.generatePlantUml(graph, style, theme);
        return renderToFormat(plantUmlContent, ExportFormat.SVG);
    }

    /**
     * 快速导出为 PDF
     */
    public byte[] exportToPdf(FlowGraph graph,
                               PlantUmlCallChainGenerator.DiagramStyle style,
                               ChartTheme theme) throws IOException {
        String plantUmlContent = generator.generatePlantUml(graph, style, theme);
        return renderToFormat(plantUmlContent, ExportFormat.PDF);
    }
}
