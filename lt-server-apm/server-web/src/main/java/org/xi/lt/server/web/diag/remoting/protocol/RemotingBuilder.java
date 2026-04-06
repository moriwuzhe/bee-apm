package org.xi.lt.server.web.diag.remoting.protocol;

public class RemotingBuilder {
    public static Datagram buildRequestDatagram(final int code, final String id, final PayloadHolder payloadHolder) {
        final Datagram datagram = new Datagram();
        datagram.setHeader(buildRemotingHeader(code, id));
        datagram.setPayloadHolder(payloadHolder);
        return datagram;
    }

    public static RemotingHeader buildRemotingHeader(final int code, final String id) {
        RemotingHeader header = new RemotingHeader();
        header.setCode(code);
        header.setId(id);
        header.setVersion(RemotingHeader.PROTOCOL_VERSION);
        header.setAgentVersion(RemotingHeader.AGENT_VERSION);
        header.setFlag(RemotingHeader.DEFAULT_FLAG);
        return header;
    }
}
