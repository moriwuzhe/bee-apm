import java.net.HttpURLConnection;
import java.net.URL;

public class TestHttp {
    public static void main(String[] args) throws Exception {
        URL url = new URL("http://127.0.0.1:7001/stream");
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        System.out.println("Before getRequestProperty");
        conn.getRequestProperty("test");
        System.out.println("After getRequestProperty");
        conn.connect();
        System.out.println("After connect");
    }
}
