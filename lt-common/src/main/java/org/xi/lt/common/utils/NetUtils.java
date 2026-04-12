package org.xi.lt.common.utils;

import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.net.UnknownHostException;
import java.util.Enumeration;
import java.util.regex.Pattern;

/**
 * 网络工具类
 * 提供获取本机IP、主机名、端口检查等网络相关能力
 */
public class NetUtils {

    private NetUtils() {
        // 工具类禁止实例化
    }

    // IP地址正则表达式
    private static final Pattern IP_PATTERN = Pattern.compile(
            "^((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$");

    // 本地IP缓存
    private static String localIp;
    private static String localHostName;

    // ====================== 本机信息获取 ======================
    /**
     * 获取本机IP地址，优先获取公网/局域网IP，过滤回环地址
     * @return 本机IP字符串
     */
    public static String getLocalIp() {
        if (localIp != null) {
            return localIp;
        }
        try {
            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
            while (interfaces.hasMoreElements()) {
                NetworkInterface ni = interfaces.nextElement();
                // 过滤虚拟网卡、回环网卡、未启动的网卡
                if (ni.isLoopback() || ni.isVirtual() || !ni.isUp()) {
                    continue;
                }
                Enumeration<InetAddress> addresses = ni.getInetAddresses();
                while (addresses.hasMoreElements()) {
                    InetAddress addr = addresses.nextElement();
                    // 过滤回环地址、IPv6地址
                    if (addr.isLoopbackAddress() || addr.getHostAddress().contains(":")) {
                        continue;
                    }
                    String ip = addr.getHostAddress();
                    if (isValidIp(ip) && !"127.0.0.1".equals(ip)) {
                        localIp = ip;
                        return ip;
                    }
                }
            }
            // 如果没有获取到，返回默认本机地址
            localIp = InetAddress.getLocalHost().getHostAddress();
            return localIp;
        } catch (SocketException | UnknownHostException e) {
            return "127.0.0.1";
        }
    }

    /**
     * 获取本机主机名
     * @return 主机名字符串
     */
    public static String getLocalHostName() {
        if (localHostName != null) {
            return localHostName;
        }
        try {
            localHostName = InetAddress.getLocalHost().getHostName();
            return localHostName;
        } catch (UnknownHostException e) {
            return "unknown";
        }
    }

    // ====================== 校验方法 ======================
    /**
     * 验证是否为合法IP地址
     * @param ip 待验证IP字符串
     * @return true：合法IP，false：非法IP
     */
    public static boolean isValidIp(String ip) {
        if (ip == null || ip.isEmpty()) {
            return false;
        }
        return IP_PATTERN.matcher(ip).matches();
    }

    /**
     * 验证端口是否在合法范围内（1-65535）
     * @param port 端口号
     * @return true：合法端口，false：非法端口
     */
    public static boolean isValidPort(int port) {
        return port > 0 && port <= 65535;
    }

    // ====================== 转换方法 ======================
    /**
     * IP字符串转long类型，方便存储和比较
     * @param ip IP字符串
     * @return long类型IP，非法IP返回0
     */
    public static long ipToLong(String ip) {
        if (!isValidIp(ip)) {
            return 0;
        }
        String[] parts = ip.split("\\.");
        return (Long.parseLong(parts[0]) << 24)
                | (Long.parseLong(parts[1]) << 16)
                | (Long.parseLong(parts[2]) << 8)
                | Long.parseLong(parts[3]);
    }

    /**
     * long类型IP转字符串
     * @param ipLong long类型IP
     * @return IP字符串
     */
    public static String longToIp(long ipLong) {
        return ((ipLong >> 24) & 0xFF) + "."
                + ((ipLong >> 16) & 0xFF) + "."
                + ((ipLong >> 8) & 0xFF) + "."
                + (ipLong & 0xFF);
    }
}
