package org.xi.lt.demo.controller;

import org.xi.lt.demo.service.DbServiceImpl;
import org.xi.lt.demo.service.HelloServiceImpl;
import org.xi.lt.demo.service.IHelloService;

import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.PrintWriter;

/**
 * Created by yuan on 2018/8/2.
 */
@WebServlet(urlPatterns = {"/db"})
public class DbTestServlet extends HttpServlet{
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response){
        String context = request.getParameter("context");
        System.out.println("=================================>DbTestServlet");
        response.setContentType("text/html");
        response.setCharacterEncoding("UTF-8");
        try {
            DbServiceImpl dbService = new DbServiceImpl();
            dbService.queryAll();
            PrintWriter writer = response.getWriter();
            writer.append("Good!");
            writer.flush();
            writer.close();
        }catch (Exception e){
            e.printStackTrace();
        }
    }
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response){
        this.doGet(request, response);
    }
}
