package org.xi.lt.common.annotation;


import java.lang.annotation.Documented;
import java.lang.annotation.Retention;
import java.lang.annotation.Target;

import static java.lang.annotation.ElementType.TYPE;
import static java.lang.annotation.RetentionPolicy.SOURCE;

/**
 * @author yuan
 * @date 2019/12/19
 */
@Retention(SOURCE)
@Documented
@Target(TYPE)
public @interface LtPlugin {
    String name();
    String type();
}
