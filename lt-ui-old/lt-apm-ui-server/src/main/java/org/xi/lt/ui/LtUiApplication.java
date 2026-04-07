package org.xi.lt.ui;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;

/**
 * @author yuan
 * @date 2018-09-23
 */
@SpringBootApplication
public class LtUiApplication extends SpringBootServletInitializer {

	@Override
	protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
		application.initializers(new LtInitializer());
		return application.sources(LtUiApplication.class);
	}

	public static void main(String[] args) throws Exception {
		SpringApplication springApplication = new SpringApplication(LtUiApplication.class);
		springApplication.addInitializers(new LtInitializer());
		springApplication.run(args);
	}

}
