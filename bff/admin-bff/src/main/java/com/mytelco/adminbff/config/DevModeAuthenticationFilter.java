package com.mytelco.adminbff.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

public class DevModeAuthenticationFilter extends OncePerRequestFilter {

    @Value("${app.security.dev-mode:false}")
    private boolean devMode;

    private static final String DEV_AUTH_HEADER = "X-Dev-Auth";
    private static final String DEV_AUTH_TOKEN = "dev-mode-token";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        if (devMode && DEV_AUTH_TOKEN.equals(request.getHeader(DEV_AUTH_HEADER))) {
            // In dev mode with dev auth header, grant ADMIN role
            var authorities = List.of(new SimpleGrantedAuthority("ROLE_ADMIN"));
            var auth = new UsernamePasswordAuthenticationToken("dev-user", null, authorities);
            SecurityContextHolder.getContext().setAuthentication(auth);
        }
        
        filterChain.doFilter(request, response);
    }
}
