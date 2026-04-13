package org.xi.lt.server.infrastructure.diag.remoting.protocol;

import java.util.Collections;
import java.util.Map;

public class RemotingHeader {
    public static final int DEFAULT_FLAG = 0;
    public static final short HEADER_SIZE_LEN = 2;
    public static final short TOTAL_SIZE_LEN = 4;
    public static final short LENGTH_FIELD = TOTAL_SIZE_LEN + HEADER_SIZE_LEN;
    public static final short PROTOCOL_VERSION = 1;
    public static final short AGENT_VERSION = 12;
    public static final int DEFAULT_MAGIC_CODE = 0xdec1_0ade;
    public static final int MIN_HEADER_LEN = HEADER_SIZE_LEN + 4 + 2 + 2 + 2 + 4 + 4 + 2;
    public static final int MIN_TOTAL_SIZE = TOTAL_SIZE_LEN + MIN_HEADER_LEN;

    private int magicCode = DEFAULT_MAGIC_CODE;
    private short version = PROTOCOL_VERSION;
    private short agentVersion = AGENT_VERSION;
    private String id;
    private int code;
    private int flag;
    private Object properties;

    public int getMagicCode() {
        return magicCode;
    }

    public void setMagicCode(int magicCode) {
        this.magicCode = magicCode;
    }

    public short getVersion() {
        return version;
    }

    public void setVersion(short version) {
        this.version = version;
    }

    public short getAgentVersion() {
        return agentVersion;
    }

    public void setAgentVersion(short agentVersion) {
        this.agentVersion = agentVersion;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public int getCode() {
        return code;
    }

    public void setCode(int code) {
        this.code = code;
    }

    public int getFlag() {
        return flag;
    }

    public void setFlag(int flag) {
        this.flag = flag;
    }

    public Object getProperties() {
        if (properties == null) {
            return Collections.emptyMap();
        }
        return properties;
    }

    public void setProperties(Object properties) {
        if (properties instanceof Map) {
            this.properties = properties;
            return;
        }
        this.properties = null;
    }
}
