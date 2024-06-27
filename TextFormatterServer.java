import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class TextFormatterServer {

    public static void main(String[] args) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);
        server.createContext("/format", new FormatHandler());
        server.setExecutor(null);
        server.start();
        System.out.println("Server started on port 8080");
    }

    static class FormatHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                ObjectMapper objectMapper = new ObjectMapper();
                InputText inputText = objectMapper.readValue(exchange.getRequestBody(), InputText.class);

                String text = inputText.getText();
                text = text.replaceAll(" {2,}", " ");

                String regex = "(\\d{4})\\s?-\\s?(\\d{4})";
                Pattern pattern = Pattern.compile(regex);
                Matcher matcher = pattern.matcher(text);
                text = matcher.replaceAll("$1 - $2");

                FormattedText formattedText = new FormattedText(text);
                String response = objectMapper.writeValueAsString(formattedText);

                exchange.getResponseHeaders().set("Content-Type", "application/json");
                exchange.sendResponseHeaders(200, response.getBytes().length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(response.getBytes());
                }
            } else {
                exchange.sendResponseHeaders(405, -1);
            }
        }
    }

    static class InputText {
        private String text;

        public String getText() {
            return text;
        }

        public void setText(String text) {
            this.text = text;
        }
    }

    static class FormattedText {
        private String formattedText;

        public FormattedText(String formattedText) {
            this.formattedText = formattedText;
        }

        public String getFormattedText() {
            return formattedText;
        }
    }
}
